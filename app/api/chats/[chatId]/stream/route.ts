import { headers } from 'next/headers'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'
import { streamingChatAgent } from '@/libs/ai-streaming'
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
      return new Response('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { message } = body

    if (!message) {
      return new Response('Message is required', { status: 400 })
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
      return new Response('Chat not found', { status: 404 })
    }

    const conversationHistory = chat.messages.map((msg) => {
      return msg.role === 'user'
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content)
    })

    const documentContext = chat.documents
      ?.map((doc) => `Title: ${doc.title}\nContent: ${doc.content}`)
      .join('\n\n')

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        
        try {
          for await (const chunk of streamingChatAgent.streamResponse(
            message,
            conversationHistory,
            documentContext
          )) {
            fullResponse += chunk
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
          }

          await prisma.message.create({
            data: {
              content: fullResponse,
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

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[AI_STREAM]', error)
    return new Response('Internal Error', { status: 500 })
  }
}