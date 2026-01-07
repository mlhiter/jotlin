import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

// DELETE /api/chat-threads/[id]/permanent - Permanently delete chat thread (physical delete)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get thread and verify ownership
    const existingThread = await prisma.chatThread.findUnique({
      where: { id },
      include: {
        project: {
          include: { workspace: true },
        },
        document: {
          include: { workspace: true },
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

    // Verify thread is soft-deleted
    if (!existingThread.isDeleted) {
      return NextResponse.json({ error: 'Thread is not deleted' }, { status: 400 })
    }

    // Physical delete - Prisma's onDelete: Cascade will automatically delete all messages
    await prisma.$transaction(async (tx) => {
      await tx.chatThread.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error permanently deleting chat thread:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
