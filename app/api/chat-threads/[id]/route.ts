import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

// PATCH /api/chat-threads/[id] - Update thread title
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    // Verify ownership through project or document workspace
    const thread = await prisma.chatThread.findUnique({
      where: { id },
      include: {
        project: { include: { workspace: true } },
        document: { include: { workspace: true } },
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const workspace = thread.project?.workspace || thread.document?.workspace
    if (workspace?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update thread title
    const updatedThread = await prisma.chatThread.update({
      where: { id },
      data: { title: title.trim() },
    })

    return NextResponse.json(updatedThread)
  } catch (error) {
    console.error('Failed to update chat thread:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/chat-threads/[id] - Soft delete thread
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership through project or document workspace
    const thread = await prisma.chatThread.findUnique({
      where: { id },
      include: {
        project: { include: { workspace: true } },
        document: { include: { workspace: true } },
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const workspace = thread.project?.workspace || thread.document?.workspace
    if (workspace?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete
    await prisma.chatThread.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete chat thread:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
