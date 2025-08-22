import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { content, role, chatId } = body

    if (!content || !role || !chatId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        isDeleted: false,
      },
      include: {
        collaborators: true,
      },
    })

    if (!chat) {
      return new NextResponse('Chat not found', { status: 404 })
    }

    // Check if user has access to this chat (owner or collaborator)
    const isOwner = chat.userId === session.user.id
    const isCollaborator = chat.collaborators.some((collaborator) => collaborator.userEmail === session.user.email)

    if (!isOwner && !isCollaborator) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const message = await prisma.message.create({
      data: {
        content,
        role,
        chatId,
        userId: session.user.id,
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
    })

    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('[MESSAGE_CREATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
