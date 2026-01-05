import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

// GET /api/chat-threads?projectId=xxx or ?documentId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const documentId = searchParams.get('documentId')

    if (!projectId && !documentId) {
      return NextResponse.json({ error: 'projectId or documentId is required' }, { status: 400 })
    }

    // Query chat threads for project or document
    const threads = await prisma.chatThread.findMany({
      where: {
        ...(projectId && { projectId }),
        ...(documentId && { documentId }),
        isDeleted: false,
      },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })

    // Map threads with metadata
    const mappedThreads = threads.map((thread) => ({
      id: thread.id,
      projectId: thread.projectId,
      documentId: thread.documentId,
      title: thread.title,
      type: thread.type,
      order: thread.order,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      messageCount: thread._count.messages,
      lastMessageAt: thread.messages[0]?.createdAt || thread.createdAt,
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
