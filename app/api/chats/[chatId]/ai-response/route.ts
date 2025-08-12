import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'
import { documentChatAgent } from '@/libs/ai-agent'
import { HumanMessage, AIMessage } from '@langchain/core/messages'

export async function POST(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    })

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { message } = body

    if (!message) {
      return new NextResponse('Message is required', { status: 400 })
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: params.chatId,
        userId: session.user.id,
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
      },
    })

    if (!chat) {
      return new NextResponse('Chat not found', { status: 404 })
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
