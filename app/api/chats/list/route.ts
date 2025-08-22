import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get chats where user is owner or collaborator
    const ownedChats = await prisma.chat.findMany({
      where: {
        userId: session.user.id,
        isDeleted: false,
      },
      include: {
        documents: {
          select: {
            id: true,
            title: true,
            icon: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            content: true,
            createdAt: true,
          },
        },
        collaborators: true,
      },
    })

    const collaboratedChats = await prisma.chat.findMany({
      where: {
        collaborators: {
          some: {
            userEmail: session.user.email,
          },
        },
        isDeleted: false,
      },
      include: {
        documents: {
          select: {
            id: true,
            title: true,
            icon: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            content: true,
            createdAt: true,
          },
        },
        collaborators: true,
      },
    })

    // Combine and deduplicate chats
    const allChats = [...ownedChats, ...collaboratedChats]
    const uniqueChats = allChats.filter((chat, index, self) => index === self.findIndex((c) => c.id === chat.id))

    // Sort by updatedAt desc
    const chats = uniqueChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return NextResponse.json(chats)
  } catch (error) {
    console.error('[CHATS_LIST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
