import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

// GET /api/chat-threads?projectId=xxx or ?documentId=xxx&type=PROJECT|DOCUMENT
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    // Query chat threads for project
    const threads = await prisma.chatThread.findMany({
      where: {
        projectId,
        type: 'PROJECT',
        isDeleted: false,
      },
      include: {
        messages: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map ChatMessage to UIMessage format
    const mappedThreads = threads.map((thread) => ({
      ...thread,
      messages: thread.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: msg.content, // content field stores parts array
        metadata: msg.metadata,
        createdAt: msg.createdAt,
      })),
    }))

    return NextResponse.json({ threads: mappedThreads })
  } catch (error) {
    console.error('Failed to get chat threads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/chat-threads - Create new chat thread
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, title, workspaceId } = body

    if (!projectId || !workspaceId) {
      return NextResponse.json({ error: 'projectId and workspaceId are required' }, { status: 400 })
    }

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          userId: session.user.id,
        },
      },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create chat thread
    const thread = await prisma.chatThread.create({
      data: {
        type: 'PROJECT',
        title: title || 'New Conversation',
        projectId,
      },
      include: {
        messages: true,
      },
    })

    return NextResponse.json(thread)
  } catch (error) {
    console.error('Failed to create chat thread:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
