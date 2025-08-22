import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const chat = await prisma.chat.findUnique({
      where: {
        id: params.chatId,
        isDeleted: false,
      },
      include: {
        collaborators: true,
      },
    })

    if (!chat) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Check if user has access to this chat (owner or collaborator)
    const isOwner = chat.userId === session.user.id
    const isCollaborator = chat.collaborators.some((collaborator) => collaborator.userEmail === session.user.email)

    if (!isOwner && !isCollaborator) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId: params.chatId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('[CHAT_MESSAGES]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
