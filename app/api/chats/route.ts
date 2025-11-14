import { NextResponse, NextRequest } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only fetch root chats (project containers)
    const chats = await prisma.chat.findMany({
      where: {
        userId: session.user.id,
        isDeleted: false,
        parentId: null, // Only root chats
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    })

    return NextResponse.json(chats)
  } catch (error) {
    console.error('Failed to fetch chats:', error)
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title } = await request.json()

    // 1. Create root chat (project container)
    const rootChat = await prisma.chat.create({
      data: {
        title: title || null,
        userId: session.user.id,
        parentId: null,
        phase: null,
      },
    })

    // 2. Create discovery phase chat
    await prisma.chat.create({
      data: {
        title: `${title || 'New Project'} - Discovery`,
        userId: session.user.id,
        parentId: rootChat.id,
        phase: 'DISCOVERY',
      },
    })

    // Return root chat
    return NextResponse.json(rootChat)
  } catch (error) {
    console.error('Failed to create chat:', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}
