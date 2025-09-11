import { createOpenAI } from '@ai-sdk/openai'
import { streamText, UIMessage, convertToModelMessages, createIdGenerator, validateUIMessages } from 'ai'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requirementAnalysisPrompt } from '@/lib/prompt'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
  // fetch: (input, init) => {
  //   return fetch(input, init)
  // },
})
// Allow streaming responses up to 30 seconds
// export const maxDuration = 30

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message }: { message: UIMessage[] } = await req.json()
    const { id: chatId } = await params

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const previousMessages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    })

    const validatedMessages = await validateUIMessages({
      // append the new message to the previous messages
      messages: [...previousMessages, message],
      // tools, // if using tools
      // metadataSchema, // if using custom metadata
      // dataSchemas, // if using custom data parts
    })

    const result = streamText({
      model: openai.chat('gemini-2.5-pro'),
      system: requirementAnalysisPrompt,
      messages: convertToModelMessages(validatedMessages),
    })

    // consume the stream to ensure it runs to completion & triggers onFinish
    // even when the client response is aborted
    result.consumeStream() // no await

    return result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,
      generateMessageId: createIdGenerator({
        prefix: 'msg',
        size: 16,
      }),
      onFinish: async ({ messages }) => {
        try {
          // Clear existing messages for this chat to avoid duplicates
          await prisma.message.deleteMany({
            where: { chatId },
          })

          // Save all messages
          if (messages.length > 0) {
            await prisma.message.createMany({
              data: messages.map((msg) => ({
                id: msg.id,
                role: msg.role,
                parts: msg.parts,
                metadata: msg.metadata,
                chatId,
              })),
            })
          }
        } catch (error) {
          console.error('Failed to save chat messages:', error)
          throw error
        }
      },
    })
  } catch (error) {
    console.error('Failed to process chat message:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    const chat = await prisma.chat.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Failed to fetch chat:', error)
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title } = await request.json()

    const { id } = await params
    const chat = await prisma.chat.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: { title },
    })

    if (chat.count === 0) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update chat:', error)
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const chat = await prisma.chat.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (chat.count === 0) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete chat:', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}
