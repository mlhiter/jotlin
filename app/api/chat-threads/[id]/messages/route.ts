import { createOpenAI } from '@ai-sdk/openai'
import { InputJsonValue } from '@prisma/client/runtime/library'
import { streamText, convertToModelMessages, createIdGenerator, validateUIMessages } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

import { requirementAnalysisPrompt } from '@/libs/ai/prompt'
import { getSessionFromRequest, getUserMessageUsage } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'
import { metadataSchema, MyUIMessage } from '@/schema/chat'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req as NextRequest)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const usage = await getUserMessageUsage(session.user.id)
    if (!usage.canSendMessage) {
      return NextResponse.json(
        {
          error: 'Message limit exceeded',
          details: {
            currentCount: usage.currentCount,
            limit: usage.limit,
            message: `You have reached your message limit of ${usage.limit}. Please contact support for more quota.`,
          },
        },
        { status: 429 }
      )
    }

    const { messages }: { messages: MyUIMessage[] } = await req.json()
    const { id: threadId } = await params

    // Verify thread exists and get thread info
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        isDeleted: false,
      },
      include: {
        project: {
          include: {
            workspace: {
              select: { userId: true },
            },
          },
        },
        document: {
          include: {
            workspace: {
              select: { userId: true },
            },
          },
        },
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Chat thread not found' }, { status: 404 })
    }

    // Verify ownership
    const workspace = thread.project?.workspace || thread.document?.workspace
    if (!workspace || workspace.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Use requirement analysis prompt for project chat
    const systemPrompt = requirementAnalysisPrompt

    const modelName = 'gemini-2.5-pro'

    const validatedMessages = await validateUIMessages({
      messages: messages,
      metadataSchema,
    })

    const modelMessages = convertToModelMessages(validatedMessages)

    const result = streamText({
      model: openai.chat(modelName),
      system: systemPrompt,
      messages: modelMessages,
    })

    return result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,
      generateMessageId: createIdGenerator({
        prefix: 'msg',
        size: 16,
      }),
      onFinish: async ({ messages }) => {
        try {
          // Clear existing messages
          await prisma.chatMessage.deleteMany({
            where: { chatThreadId: threadId },
          })

          // Save all messages
          if (messages.length > 0) {
            await prisma.chatMessage.createMany({
              data: messages.map((msg, index) => ({
                id: msg.id,
                role: msg.role,
                content: msg.parts as InputJsonValue,
                metadata: msg.metadata as InputJsonValue,
                chatThreadId: threadId,
                order: index,
              })),
            })
          }

          // Update thread's updatedAt
          await prisma.chatThread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() },
          })
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

// Rollback endpoint
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req as NextRequest)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages }: { messages: MyUIMessage[] } = await req.json()
    const { id: threadId } = await params

    // Verify thread ownership
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        isDeleted: false,
      },
      include: {
        project: {
          include: {
            workspace: {
              select: { userId: true },
            },
          },
        },
        document: {
          include: {
            workspace: {
              select: { userId: true },
            },
          },
        },
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Chat thread not found' }, { status: 404 })
    }

    const workspace = thread.project?.workspace || thread.document?.workspace
    if (!workspace || workspace.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Save rolled back messages
    await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      await tx.chatMessage.deleteMany({
        where: { chatThreadId: threadId },
      })

      if (messages.length > 0) {
        await tx.chatMessage.createMany({
          data: messages.map((msg, index) => ({
            id: msg.id,
            role: msg.role,
            content: msg.parts as InputJsonValue,
            metadata: msg.metadata as InputJsonValue,
            chatThreadId: threadId,
            order: index,
          })),
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to rollback messages:', error)
    return NextResponse.json({ error: 'Failed to rollback messages' }, { status: 500 })
  }
}
