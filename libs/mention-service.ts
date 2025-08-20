import { ParsedMention } from '@/libs/mention-parser'
import { prisma } from '@/libs/prisma'

export interface MentionProcessingResult {
  success: boolean
  notifications: any[]
  error?: string
}

/**
 * 处理mentions并创建相应的数据库记录和通知
 */
export async function processMentions({
  mentions,
  commentId,
  documentId,
  mentionerName,
  documentTitle,
}: {
  mentions: ParsedMention[]
  commentId: string
  documentId: string
  mentionerName: string
  documentTitle: string
}): Promise<MentionProcessingResult> {
  try {
    const notifications = []

    for (const mention of mentions) {
      if (mention.type === 'user' && mention.targetEmail) {
        // 查找被@的用户
        const targetUser = await prisma.user.findUnique({
          where: { email: mention.targetEmail },
        })

        if (targetUser) {
          // 创建@提及记录
          const mentionRecord = await prisma.mention.create({
            data: {
              type: 'user',
              targetUserId: targetUser.id,
              targetEmail: targetUser.email,
              commentId: commentId,
            },
          })

          // 创建通知
          const notification = await prisma.notification.create({
            data: {
              type: 'mention',
              title: `${mentionerName} 在评论中@了你`,
              content: `在文档《${documentTitle}》的评论中提到了你`,
              userId: targetUser.id,
              documentId: documentId,
              commentId: commentId,
              mentionId: mentionRecord.id,
            },
          })

          notifications.push(notification)
        }
      } else if (mention.type === 'ai') {
        // 创建AI提及记录
        const mentionRecord = await prisma.mention.create({
          data: {
            type: 'ai',
            commentId: commentId,
          },
        })

        // AI提及不需要创建通知，但需要返回mention记录
        notifications.push({ type: 'ai', mentionId: mentionRecord.id })
      }
    }

    return {
      success: true,
      notifications,
    }
  } catch (error) {
    console.error('[MENTION_SERVICE]', error)
    return {
      success: false,
      notifications: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
