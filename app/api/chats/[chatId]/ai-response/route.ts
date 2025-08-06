import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

async function getAIResponse(message: string, context: any[]): Promise<string> {
  // TODO: 集成 OpenAI API 或其他 AI 服务

  await new Promise((resolve) => setTimeout(resolve, 1000))

  const responses = [
    `我理解你说的 "${message}"。让我来帮助你。`,
    `关于 "${message}"，我有一些想法可以分享。`,
    `这是一个很好的问题。让我详细解释一下...`,
    `根据你提到的内容，我建议...`,
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}

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

    const aiResponseContent = await getAIResponse(message, chat.messages)

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
