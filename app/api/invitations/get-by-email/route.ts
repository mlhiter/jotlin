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
    const email = searchParams.get('email')
    const countOnly = searchParams.get('countOnly') === 'true'

    if (!email) {
      return new NextResponse('Email is required', { status: 400 })
    }

    // 获取用户信息，包括最后查看inbox的时间
    const user = await prisma.user.findUnique({
      where: { email },
      select: { inboxLastViewedAt: true },
    })

    const invitationsAsUser = await prisma.invitation.findMany({
      where: {
        userEmail: email,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const invitationsAsCollaborator = await prisma.invitation.findMany({
      where: {
        collaboratorEmail: email,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const invitations = [...invitationsAsUser, ...invitationsAsCollaborator]

    // 如果只需要未读数量
    if (countOnly) {
      const inboxLastViewedAt = user?.inboxLastViewedAt

      const unreadCount = invitations.filter((inv) => {
        // 如果用户从未查看过inbox，所有有效邀请都算未读
        if (!inboxLastViewedAt) {
          if (inv.collaboratorEmail === email) {
            return !inv.isReplied
          } else if (inv.userEmail === email) {
            return inv.isReplied
          }
          return false
        }

        // 只有在最后查看时间之后创建的邀请才算未读
        const invitationTime = inv.createdAt
        const isAfterLastView =
          new Date(invitationTime) > new Date(inboxLastViewedAt)

        if (!isAfterLastView) {
          return false // 在最后查看时间之前的邀请不算未读
        }

        // 应用原有的未读逻辑
        if (inv.collaboratorEmail === email) {
          return !inv.isReplied
        } else if (inv.userEmail === email) {
          return inv.isReplied
        }
        return false
      }).length

      return NextResponse.json({ count: unreadCount })
    }

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('[INVITATION_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
