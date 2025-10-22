import { NextResponse } from 'next/server'

import { prisma } from '@/libs/utils/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const chat = await prisma.chat.findFirst({
      where: {
        id,
        isPublic: true,
        isDeleted: false,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or not public' }, { status: 404 })
    }

    // Remove sensitive user information and only return what's needed for preview
    const publicChat = {
      id: chat.id,
      title: chat.title,
      messages: chat.messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      author: chat.user.name,
    }

    return NextResponse.json(publicChat)
  } catch (error) {
    console.error('Failed to fetch public chat:', error)
    return NextResponse.json({ error: 'Failed to fetch public chat' }, { status: 500 })
  }
}
