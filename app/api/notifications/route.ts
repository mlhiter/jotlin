import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const countOnly = searchParams.get('countOnly') === 'true'
    const documentId = searchParams.get('documentId')

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

        // 如果指定了documentId，则只计算与该文档相关的通知
        if (documentId) {
          whereClause.documentId = documentId
        }

        const count = await prisma.notification.count({
          where: whereClause,
        })
        return NextResponse.json({ count })
      } catch (error) {
        console.error('Error counting notifications:', error)
        return NextResponse.json({ count: 0 }, { status: 500 })
      }
    }

    try {
      const whereClause: any = {
        userId: user.id,
      }

      // 如果指定了documentId，则只获取与该文档相关的通知
      if (documentId) {
        whereClause.documentId = documentId
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      })

      return NextResponse.json(notifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json([])
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
    const documentId = searchParams.get('documentId')

    // 根据邮箱查找用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    if (markAllAsRead) {
      const whereClause: any = {
        userId: user.id,
        isRead: false,
      }

      // 如果指定了documentId，则只标记与该文档相关的通知为已读
      if (documentId) {
        whereClause.documentId = documentId
      }

      const result = await prisma.notification.updateMany({
        where: whereClause,
        data: {
          isRead: true,
        },
      })
      return NextResponse.json(result)
    }

    if (!notificationId) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id,
      },
      data: {
        isRead: true,
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[NOTIFICATIONS_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
