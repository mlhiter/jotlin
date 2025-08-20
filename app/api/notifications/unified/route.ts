import { NextResponse } from 'next/server'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const countOnly = searchParams.get('countOnly') === 'true'
    const type = searchParams.get('type')

    // 根据邮箱查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    if (countOnly) {
      try {
        const whereClause: any = {
          userId: user.id,
          isRead: false,
        }

        if (type) {
          whereClause.type = type
        }

        // 计算通知表中的未读数量
        const notificationCount = await prisma.notification.count({
          where: whereClause,
        })

        // 计算邀请的未读数量（只有当未过滤类型或过滤类型为 invitation 时才计算）
        let invitationCount = 0
        if (!type || type === 'invitation') {
          invitationCount = await prisma.invitation.count({
            where: {
              collaboratorEmail: session.user.email,
              isValid: true,
              isReplied: false, // 未回复的邀请视为未读
            },
          })
        }

        const totalCount = notificationCount + invitationCount
        return NextResponse.json({ count: totalCount })
      } catch (error) {
        console.error('Error counting notifications:', error)
        return NextResponse.json({ count: 0 }, { status: 500 })
      }
    }

    try {
      const whereClause: any = {
        userId: user.id,
      }

      if (type) {
        whereClause.type = type
      }

      // 获取统一通知 + 邀请转换的通知
      const [notifications, invitations, chatInvitations] = await Promise.all([
        // 获取现有的通知
        prisma.notification.findMany({
          where: whereClause,
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
        }),
        // 获取文档邀请并转换为通知格式（只有当未过滤类型或过滤类型为 invitation 时才查询）
        !type || type === 'invitation'
          ? prisma.invitation.findMany({
              where: {
                collaboratorEmail: session.user.email,
                isValid: true,
              },
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: limit,
            })
          : Promise.resolve([]),
        // 获取聊天邀请并转换为通知格式
        !type || type === 'chat_invitation'
          ? prisma.chatInvitation.findMany({
              where: {
                collaboratorEmail: session.user.email,
                isValid: true,
              },
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    image: true,
                  },
                },
                chat: {
                  select: {
                    title: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: limit,
            })
          : Promise.resolve([]),
      ])

      // 将文档邀请转换为统一通知格式
      const invitationNotifications = await Promise.all(
        invitations.map(async (invitation) => {
          // 获取文档信息
          const document = await prisma.document.findUnique({
            where: { id: invitation.documentId },
            select: { title: true },
          })

          return {
            id: `invitation_${invitation.id}`,
            type: 'invitation',
            title: `${invitation.user.name || invitation.userEmail} 邀请你协作`,
            content: `你被邀请协作文档「${document?.title || '未知文档'}」`,
            isRead: invitation.isReplied, // 已回复视为已读
            priority: 'high',
            createdAt: invitation.createdAt.toISOString(),
            documentId: invitation.documentId,
            documentTitle: document?.title,
            invitationId: invitation.id,
            senderId: null,
            senderName: invitation.user.name,
            senderEmail: invitation.userEmail,
          }
        })
      )

      // 将聊天邀请转换为统一通知格式
      const chatInvitationNotifications = chatInvitations.map(
        (chatInvitation) => ({
          id: `chat_invitation_${chatInvitation.id}`,
          type: 'chat_invitation',
          title: `${chatInvitation.user.name || chatInvitation.userEmail} 邀请你协作聊天`,
          content: `你被邀请协作聊天「${chatInvitation.chat.title}」`,
          isRead: chatInvitation.isReplied, // 已回复视为已读
          priority: 'high',
          createdAt: chatInvitation.createdAt.toISOString(),
          chatId: chatInvitation.chatId,
          chatTitle: chatInvitation.chat.title,
          chatInvitationId: chatInvitation.id,
          senderId: null,
          senderName: chatInvitation.user.name,
          senderEmail: chatInvitation.userEmail,
        })
      )

      // 合并并按时间排序
      const allNotifications = [
        ...notifications,
        ...invitationNotifications,
        ...chatInvitationNotifications,
      ]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, limit)

      return NextResponse.json(allNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json([], { status: 500 })
    }
  } catch (error) {
    console.error('[NOTIFICATIONS_GET]', error)
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
    const notificationId = searchParams.get('id')
    const markAllAsRead = searchParams.get('markAllAsRead') === 'true'

    // 根据邮箱查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    if (markAllAsRead) {
      // 标记所有通知为已读
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      })

      // 同时更新用户的 inboxLastViewedAt
      await prisma.user.update({
        where: { id: user.id },
        data: {
          inboxLastViewedAt: new Date(),
        },
      })

      return NextResponse.json({ success: true })
    }

    if (notificationId) {
      // 处理邀请类型的通知
      if (notificationId.startsWith('invitation_')) {
        const invitationId = notificationId.replace('invitation_', '')
        // 对于邀请通知，我们不直接标记为已读，因为它们需要用户明确接受或拒绝
        return NextResponse.json({ success: true })
      }

      // 标记单个通知为已读
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId: user.id,
        },
        data: {
          isRead: true,
        },
      })

      return NextResponse.json(notification)
    }

    return new NextResponse('Missing parameters', { status: 400 })
  } catch (error) {
    console.error('[NOTIFICATIONS_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
