import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { NextRequest, NextResponse } from 'next/server'

import { documentChatAgent } from '@/libs/ai-agent'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { message } = body

    if (!message) {
      return new NextResponse('Message is required', { status: 400 })
    }

    const chat = await prisma.chat.findUnique({
      where: {
        id: params.chatId,
        isDeleted: false,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        documents: {
          select: {
            id: true,
            title: true,
            content: true,
          },
        },
        collaborators: true,
      },
    })

    if (!chat) {
      return new NextResponse('Chat not found', { status: 404 })
    }

    // Check if user has access to this chat (owner or collaborator)
    const isOwner = chat.userId === session.user.id
    const isCollaborator = chat.collaborators.some(
      (collaborator) => collaborator.userEmail === session.user.email
    )

    if (!isOwner && !isCollaborator) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const conversationHistory = chat.messages.map((msg) => {
      return msg.role === 'user'
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content)
    })

    const documentContext = chat.documents
      ?.map((doc) => `Title: ${doc.title}\nContent: ${doc.content}`)
      .join('\n\n')

    const aiResponseContent = await documentChatAgent.processMessage(
      message,
      conversationHistory,
      documentContext
    )

    const aiMessage = await prisma.message.create({
      data: {
        content: aiResponseContent,
        role: 'assistant',
        chatId: params.chatId,
        userId: session.user.id,
      },
    })

    await prisma.chat.update({
      where: {
        id: params.chatId,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(aiMessage)
  } catch (error) {
    console.error('[AI_RESPONSE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
