import { NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'
import { parseMentions, validateMentions } from '@/libs/mention-parser'
import { processMentions } from '@/libs/mention-service'
import {
  processAIMentionDirect,
  applyAIModification,
} from '@/libs/ai-mention-service'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { documentId, content, blockId, replyToCommentId } = await req.json()

    if (!documentId || !content || !blockId) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // 获取文档信息和协作者
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        collaborators: true,
        user: {
          select: { email: true },
        },
      },
    })

    if (!document) {
      return new NextResponse('Document not found', { status: 404 })
    }

    // 解析@提及
    const mentions = parseMentions(content)

    // 构建协作者列表（包括文档所有者）
    const allCollaborators = [
      ...document.collaborators,
      { userEmail: document.user.email },
    ]

    // 验证@提及
    const validMentions = validateMentions(mentions, allCollaborators)
    if (validMentions.length > 0) {
      console.log(
        '🎯 Found valid mentions:',
        validMentions.map((m) => ({
          type: m.type,
          targetEmail: m.targetEmail,
          originalText: m.originalText,
        }))
      )
    }

    // 计算回复顺序
    let replyOrder = 0
    if (replyToCommentId) {
      // 如果是回复，找到被回复评论的replyOrder，新评论的order = 被回复评论的order + 1
      const replyToComment = await prisma.comment.findUnique({
        where: { id: replyToCommentId },
        select: { replyOrder: true },
      })
      if (replyToComment) {
        replyOrder = replyToComment.replyOrder + 1
      }
    }

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        content,
        blockId,
        documentId,
        userId: user.id,
        replyToCommentId: replyToCommentId || undefined,
        replyOrder,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            email: true,
          },
        },
        replyToComment: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // 创建评论回复通知
    if (replyToCommentId) {
      try {
        const originalComment = await prisma.comment.findUnique({
          where: { id: replyToCommentId },
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        })

        if (originalComment && originalComment.userId !== user.id) {
          // 获取文档信息
          const document = await prisma.document.findUnique({
            where: { id: documentId },
            select: { title: true },
          })

          // 为原评论作者创建通知
          await prisma.notification.create({
            data: {
              type: 'comment_reply',
              title: `${user.name} 回复了你的评论`,
              content: `在文档《${document?.title || '未知文档'}》中回复了你的评论`,
              userId: originalComment.userId,
              documentId: documentId,
              commentId: comment.id,
            },
          })
        }
      } catch (error) {
        console.error('Error creating reply notification:', error)
      }
    }

    // 处理@提及
    let aiProcessingResults: string[] = []
    let documentModified = false
    let newDocumentContent: string | undefined

    if (validMentions.length > 0) {
      try {
        // 创建通知 - 直接调用函数
        const result = await processMentions({
          mentions: validMentions,
          commentId: comment.id,
          documentId,
          mentionerName: user.name,
          documentTitle: document.title,
        })

        if (result.success) {
          console.log(
            '✅ Mentions processed successfully, notifications created:',
            result.notifications.length
          )
        } else {
          console.error('❌ Mention processing failed:', result.error)
        }

        // 处理AI提及
        const aiMentions = validMentions.filter((m) => m.type === 'ai')
        for (const aiMention of aiMentions) {
          try {
            // 获取评论链上下文（如果是回复）
            let commentChain: Array<{
              content: string
              isAI: boolean
              createdAt: string
            }> = []

            if (replyToCommentId) {
              // 获取评论链历史
              const chainComments = await prisma.comment.findMany({
                where: {
                  blockId,
                  documentId,
                },
                include: {
                  user: true,
                },
                orderBy: {
                  replyOrder: 'asc',
                },
              })

              commentChain = chainComments.map((c) => ({
                content: c.content,
                isAI: c.user.email === 'ai@jotlin.com' || !!c.isAIReply,
                createdAt: c.createdAt.toISOString(),
              }))
            }

            // 直接调用AI处理逻辑，避免循环调用
            const aiAction = await processAIMentionDirect({
              commentContent: content,
              documentId,
              blockId,
              documentContent: document.content || '',
              documentTitle: document.title,
              replyToCommentId,
              commentChain,
            })

            if (aiAction.type !== 'no_action') {
              const result = await applyAIModification(
                documentId,
                aiAction,
                blockId
              )
              aiProcessingResults.push(result.message)
              if (
                result.success &&
                (aiAction.type === 'modify_content' ||
                  aiAction.type === 'add_content')
              ) {
                documentModified = true
                if (result.newContent) {
                  newDocumentContent = result.newContent
                }
              }
              console.log('AI处理结果:', result.message)

              // AI创建回复评论
              try {
                const aiUser = await prisma.user.findFirst({
                  where: {
                    email: 'ai@jotlin.com',
                  },
                })

                if (!aiUser) {
                  // 创建AI用户
                  const newAiUser = await prisma.user.create({
                    data: {
                      email: 'ai@jotlin.com',
                      name: 'AI Assistant',
                      password: '', // AI用户不需要密码
                      emailVerified: true,
                      imageUrl: '/logo.svg',
                    },
                  })

                  await prisma.comment.create({
                    data: {
                      content: result.message,
                      blockId,
                      documentId,
                      userId: newAiUser.id,
                      replyToCommentId: comment.id,
                      replyOrder: comment.replyOrder + 1, // AI回复的order比被回复评论大1
                      isAIReply: true,
                    },
                  })
                } else {
                  await prisma.comment.create({
                    data: {
                      content: result.message,
                      blockId,
                      documentId,
                      userId: aiUser.id,
                      replyToCommentId: comment.id,
                      replyOrder: comment.replyOrder + 1, // AI回复的order比被回复评论大1
                      isAIReply: true,
                    },
                  })
                }
              } catch (aiReplyError) {
                console.error('Error creating AI reply:', aiReplyError)
              }
            } else {
              aiProcessingResults.push(aiAction.reasoning || 'AI无法处理此请求')
            }
          } catch (aiError) {
            console.error('Error processing AI mention:', aiError)
            aiProcessingResults.push('AI处理时出错，请稍后再试')
          }
        }
      } catch (mentionError) {
        console.error('❌ Error processing mentions:', mentionError)
        console.error(
          '❌ Mention processing failed, but comment was still created'
        )
        // 提及处理失败不应该影响评论创建
      }
    }

    // 返回评论和AI处理结果
    return NextResponse.json({
      comment,
      aiResults: aiProcessingResults,
      documentModified, // 告诉前端文档是否被修改
      newContent: newDocumentContent, // 返回新的文档内容
    })
  } catch (error) {
    console.error('[COMMENTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get('id')

    if (!commentId) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    // 获取评论信息以检查权限
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true },
    })

    if (!comment) {
      return new NextResponse('Comment not found', { status: 404 })
    }

    // 只允许评论作者删除评论
    if (comment.user.email !== session.user.email) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // 删除评论
    await prisma.comment.delete({
      where: { id: commentId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[COMMENTS_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get('id')
    const { content } = await req.json()

    if (!commentId || !content) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    // 获取评论信息以检查权限
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true },
    })

    if (!comment) {
      return new NextResponse('Comment not found', { status: 404 })
    }

    // 只允许评论作者编辑评论
    if (comment.user.email !== session.user.email) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // 更新评论
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('[COMMENTS_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get('documentId')
    const incrementalUpdate = searchParams.get('incrementalUpdate') === 'true'
    const since = searchParams.get('since')

    if (!documentId) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    // 构建查询条件
    const whereCondition: any = {
      documentId,
    }

    // 如果是增量更新且提供了since参数，只获取该时间之后的评论
    if (incrementalUpdate && since) {
      whereCondition.createdAt = {
        gt: new Date(since),
      }
    }

    const comments = await prisma.comment.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            name: true,
            image: true,
            email: true,
          },
        },
        replyToComment: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          blockId: 'asc', // 先按块ID排序
        },
        {
          replyOrder: 'asc', // 再按回复顺序排序
        },
        {
          createdAt: 'asc', // 最后按创建时间排序
        },
      ],
    })

    // 如果是增量更新，返回带有lastUpdateTime的结构
    if (incrementalUpdate) {
      return NextResponse.json({
        comments,
        lastUpdateTime: new Date().toISOString(),
        isIncremental: true,
      })
    }

    // 普通请求直接返回评论数组
    return NextResponse.json(comments)
  } catch (error) {
    console.error('[COMMENTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
