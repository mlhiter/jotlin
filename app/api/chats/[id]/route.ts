import { createOpenAI } from '@ai-sdk/openai'
import { InputJsonValue } from '@prisma/client/runtime/library'
import { streamText, convertToModelMessages, createIdGenerator, validateUIMessages } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

import { getModelForPhase } from '@/libs/ai/model-config'
import {
  requirementAnalysisPrompt,
  technicalArchitectureAnalysisPrompt,
  developmentPlanAnalysisPrompt,
} from '@/libs/ai/prompt'
import { getSessionFromRequest, getUserMessageUsage } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'
import { metadataSchema, MyUIMessage } from '@/schema/chat'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
  // fetch: (input, init) => {
  //   return fetch(input, init)
  // },
})
// Allow streaming responses up to 30 seconds
// export const maxDuration = 30

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
    const { id: chatId } = await params

    // Log to check if files are received
    console.info('API received messages:', messages.length)
    messages.forEach((msg, idx) => {
      console.info(
        `Message ${idx} parts:`,
        msg.parts.map((p) => p.type)
      )
      const fileParts = msg.parts.filter((p) => p.type === 'file')
      if (fileParts.length > 0) {
        console.info(
          `Message ${idx} has ${fileParts.length} file parts:`,
          fileParts.map((p) => ({
            type: p.type,
            mediaType: p.mediaType,
            hasUrl: !!p.url,
          }))
        )
      }
    })

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
        isDeleted: false,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        phase: true,
        parentId: true,
        isDeleted: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Determine the actual chat to use for phase detection
    let targetChat = chat
    let targetChatId = chatId

    // If this is a root chat (project container), find the active phase chat
    if (chat.phase === null && chat.parentId === null) {
      const activePhaseChat = await prisma.chat.findFirst({
        where: {
          parentId: chatId,
          userId: session.user.id,
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          userId: true,
          title: true,
          phase: true,
          parentId: true,
          isDeleted: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      })

      if (activePhaseChat) {
        targetChat = activePhaseChat
        targetChatId = activePhaseChat.id
      }
    }

    // Select system prompt based on chat phase
    let systemPrompt = requirementAnalysisPrompt

    if (targetChat.phase === 'ARCHITECTURE') {
      systemPrompt = technicalArchitectureAnalysisPrompt
    } else if (targetChat.phase === 'DEVELOPMENT') {
      systemPrompt = developmentPlanAnalysisPrompt
    } else if (targetChat.phase === 'REQUIREMENT') {
      systemPrompt = requirementAnalysisPrompt
    }

    // Select model based on chat phase
    const modelName = getModelForPhase(targetChat.phase)

    const validatedMessages = await validateUIMessages({
      // append the new message to the previous messages
      messages: messages,
      metadataSchema, // if using custom metadata
      // dataSchemas, // if using custom data parts
      // tools, // if using tools
    })

    console.info('Validated messages:', validatedMessages.length)
    validatedMessages.forEach((msg, idx) => {
      console.info(
        `Validated message ${idx} parts:`,
        msg.parts.map((p) => p.type)
      )
    })

    const modelMessages = convertToModelMessages(validatedMessages)
    console.info('Model messages:', modelMessages.length)
    modelMessages.forEach((msg, idx) => {
      console.info(`Model message ${idx}:`, {
        role: msg.role,
        contentType: typeof msg.content,
        contentIsArray: Array.isArray(msg.content),
        contentLength: Array.isArray(msg.content) ? msg.content.length : 1,
      })
    })

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
          // Clear existing messages for this chat to avoid duplicates
          await prisma.message.deleteMany({
            where: { chatId: targetChatId },
          })

          // Save all messages to the target chat (phase chat if applicable)
          if (messages.length > 0) {
            await prisma.message.createMany({
              data: messages.map((msg) => ({
                id: msg.id,
                role: msg.role,
                parts: msg.parts as InputJsonValue,
                metadata: msg.metadata as InputJsonValue,
                chatId: targetChatId,
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request as NextRequest)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    const chat = await prisma.chat.findFirst({
      where: {
        id,
        userId: session.user.id,
        isDeleted: false,
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request as NextRequest)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, isPublic } = body

    const { id } = await params

    // Prepare update data
    const updateData: { title?: string; isPublic?: boolean } = {}
    if (title !== undefined) updateData.title = title
    if (isPublic !== undefined) updateData.isPublic = isPublic

    const chat = await prisma.chat.updateMany({
      where: {
        id,
        userId: session.user.id,
        isDeleted: false,
      },
      data: updateData,
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request as NextRequest)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const chat = await prisma.chat.updateMany({
      where: {
        id,
        userId: session.user.id,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
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
