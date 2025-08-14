import { NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'
import { parseMentions, validateMentions } from '@/libs/mention-parser'
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

    const { documentId, content, blockId } = await req.json()

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

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        content,
        blockId,
        documentId,
        userId: user.id,
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

    // 处理@提及
    let aiProcessingResults: string[] = []

    if (validMentions.length > 0) {
      try {
        // 创建通知 - 通过API调用
        const mentionResponse = await fetch(
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mentions/create`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: req.headers.get('cookie') || '', // 传递认证信息
            },
            body: JSON.stringify({
              mentions: validMentions,
              commentId: comment.id,
              documentId,
              mentionerName: user.name,
              documentTitle: document.title,
            }),
          }
        )

        let notifications = []
        if (mentionResponse.ok) {
          notifications = await mentionResponse.json()
        }

        // 处理AI提及
        const aiMentions = validMentions.filter((m) => m.type === 'ai')
        for (const aiMention of aiMentions) {
          try {
            // 直接调用AI处理逻辑，避免循环调用
            const aiAction = await processAIMentionDirect({
              commentContent: content,
              documentId,
              blockId,
              documentContent: document.content || '',
              documentTitle: document.title,
            })

            if (aiAction.type !== 'no_action') {
              const result = await applyAIModification(documentId, aiAction)
              aiProcessingResults.push(result.message)
              console.log('AI处理结果:', result.message)
            } else {
              aiProcessingResults.push(aiAction.reasoning || 'AI无法处理此请求')
            }
          } catch (aiError) {
            console.error('Error processing AI mention:', aiError)
            aiProcessingResults.push('AI处理时出错，请稍后再试')
          }
        }
      } catch (mentionError) {
        console.error('Error processing mentions:', mentionError)
        // 提及处理失败不应该影响评论创建
      }
    }

    // 返回评论和AI处理结果
    return NextResponse.json({
      comment,
      aiResults: aiProcessingResults,
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

    if (!documentId) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    const comments = await prisma.comment.findMany({
      where: {
        documentId,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('[COMMENTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
