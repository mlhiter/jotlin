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

    let messages = chat.messages
    let documents = null
    let phaseChatsData = null

    // If this is a project root chat (no phase, no parent), get messages from phase chats and documents
    if (chat.parentId === null && chat.phase === null) {
      const phaseChats = await prisma.chat.findMany({
        where: {
          parentId: id,
          isDeleted: false,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      // Collect all messages from all phase chats
      messages = phaseChats.flatMap((phaseChat) => phaseChat.messages)

      // Return phase chats info for switching
      phaseChatsData = phaseChats.map((pc) => ({
        id: pc.id,
        title: pc.title,
        phase: pc.phase,
        createdAt: pc.createdAt,
        messages: pc.messages,
      }))

      // Fetch documents for project chat
      const docs = await prisma.document.findMany({
        where: {
          chatId: id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      documents = {
        requirement: docs.find((d) => d.phase === 'REQUIREMENT')
          ? {
              id: docs.find((d) => d.phase === 'REQUIREMENT')!.id,
              content: docs.find((d) => d.phase === 'REQUIREMENT')!.content,
              status: docs.find((d) => d.phase === 'REQUIREMENT')!.status,
            }
          : null,
        architecture: docs.find((d) => d.phase === 'ARCHITECTURE')
          ? {
              id: docs.find((d) => d.phase === 'ARCHITECTURE')!.id,
              content: docs.find((d) => d.phase === 'ARCHITECTURE')!.content,
              status: docs.find((d) => d.phase === 'ARCHITECTURE')!.status,
            }
          : null,
        development: docs.find((d) => d.phase === 'DEVELOPMENT')
          ? {
              id: docs.find((d) => d.phase === 'DEVELOPMENT')!.id,
              content: docs.find((d) => d.phase === 'DEVELOPMENT')!.content,
              status: docs.find((d) => d.phase === 'DEVELOPMENT')!.status,
            }
          : null,
      }
    }

    // Remove sensitive user information and only return what's needed for preview
    const publicChat = {
      id: chat.id,
      title: chat.title,
      messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      author: chat.user.name,
      documents,
      phaseChats: phaseChatsData,
    }

    return NextResponse.json(publicChat)
  } catch (error) {
    console.error('Failed to fetch public chat:', error)
    return NextResponse.json({ error: 'Failed to fetch public chat' }, { status: 500 })
  }
}
