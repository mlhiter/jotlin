import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

// POST /api/chat-threads/[id]/restore - Restore deleted chat thread
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get thread and parent status
    const existingThread = await prisma.chatThread.findUnique({
      where: { id },
      include: {
        project: {
          include: { workspace: true },
        },
        document: {
          include: {
            workspace: true,
            project: true,
          },
        },
      },
    })

    if (!existingThread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Verify ownership
    const workspace = existingThread.project?.workspace || existingThread.document?.workspace
    if (workspace?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify thread is deleted
    if (!existingThread.isDeleted) {
      return NextResponse.json({ error: 'Thread is not deleted' }, { status: 400 })
    }

    // Critical validations: Cannot restore if parent is deleted
    if (existingThread.project?.isDeleted) {
      return NextResponse.json(
        {
          error: 'Cannot restore chat thread',
          details: 'Parent project is deleted. Please restore the project first.',
        },
        { status: 400 }
      )
    }

    if (existingThread.document?.isDeleted) {
      return NextResponse.json(
        {
          error: 'Cannot restore chat thread',
          details: 'Parent document is deleted. Please restore the document first.',
        },
        { status: 400 }
      )
    }

    // Also check if document's parent project is deleted
    if (existingThread.document?.project?.isDeleted) {
      return NextResponse.json(
        {
          error: 'Cannot restore chat thread',
          details: "Parent document's project is deleted. Please restore the project first.",
        },
        { status: 400 }
      )
    }

    // Restore chat thread
    const restoredThread = await prisma.chatThread.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    return NextResponse.json(restoredThread)
  } catch (error) {
    console.error('Error restoring chat thread:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
