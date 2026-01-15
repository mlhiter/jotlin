import { createOpenAI } from '@ai-sdk/openai'
import { InputJsonValue } from '@prisma/client/runtime/library'
import { streamText, convertToModelMessages, validateUIMessages, stepCountIs, createIdGenerator } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

import { projectNameAgent } from '@/libs/ai/agents/project-name-agent'
import { requirementAnalysisPrompt } from '@/libs/ai/prompt'
import { DocumentToolContext } from '@/libs/ai/tools'
import { getSessionFromRequest, getUserMessageUsage } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'
import { metadataSchema, MyUIMessage } from '@/schema/chat'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

// GET /api/chat-threads/[id]/messages - Get all messages for a thread
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: threadId } = await params

    // Verify thread ownership
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        isDeleted: false,
      },
      include: {
        project: { include: { workspace: true } },
        document: { include: { workspace: true } },
        messages: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const workspace = thread.project?.workspace || thread.document?.workspace
    if (workspace?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Map ChatMessage to UIMessage format
    const messages = thread.messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: msg.content, // content field stores parts array
      metadata: msg.metadata,
      createdAt: msg.createdAt,
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Failed to get thread messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const modelMessages = await convertToModelMessages(validatedMessages)

    const workspaceId = thread.project?.workspaceId || thread.document?.workspaceId
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const toolContext: DocumentToolContext = {
      chatThreadId: threadId,
      projectId: thread.projectId || undefined,
      workspaceId,
      userId: session.user.id,
      messageId: '',
    }

    const result = streamText({
      model: openai.chat(modelName),
      system: systemPrompt,
      messages: modelMessages,
      stopWhen: stepCountIs(5),
      tools: createDocumentTools(toolContext),
      experimental_context: toolContext,
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

          const isFirstMessage = messages.filter((msg) => msg.role === 'user').length === 1
          // If this is the first user message and the project title is default, generate a project name
          if (isFirstMessage && thread.projectId) {
            const project = await prisma.project.findUnique({
              where: { id: thread.projectId },
            })

            if (project) {
              // Check if title is still default or empty
              const isDefaultTitle = !project.title || project.title === 'New Project'

              if (isDefaultTitle) {
                // Extract the first user message text
                const userMessage = validatedMessages.find((msg) => msg.role === 'user')
                if (userMessage && userMessage.parts && userMessage.parts.length > 0) {
                  const messageText = userMessage.parts
                    .filter((part) => part.type === 'text')
                    .map((part) => part.text)
                    .join(' ')
                    .trim()

                  if (messageText && messageText.length > 0) {
                    // Generate project name from the first message
                    const generatedName = await generateProjectNameFromDescription(messageText)

                    if (generatedName && generatedName.length > 0) {
                      // Update the project title
                      await prisma.project.update({
                        where: { id: thread.projectId },
                        data: { title: generatedName },
                      })
                    }
                  }
                }
              }
            }
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

export async function generateProjectNameFromDescription(description: string): Promise<string | null> {
  try {
    const result = await projectNameAgent.generate({
      prompt: `Generate a project name for: ${description}`,
    })

    const projectName = result.text
      .trim()
      .replace(/^[""'"`]|[""'"`]$/, '')
      .trim()

    if (!projectName || projectName.length === 0 || projectName === description) {
      return null
    }

    return projectName
  } catch (error) {
    console.error('Failed to generate project name:', error)
    return null
  }
}
