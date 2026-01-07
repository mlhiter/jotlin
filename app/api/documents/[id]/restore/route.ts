import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

// POST /api/documents/[id]/restore - Restore deleted document
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get document and parent project status
    const existingDocument = await prisma.document.findFirst({
      where: {
        id,
        workspace: { userId: session.user.id },
        isDeleted: true,
      },
      include: { project: true },
    })

    if (!existingDocument) {
      return NextResponse.json({ error: 'Deleted document not found' }, { status: 404 })
    }

    // Critical validation: Cannot restore if parent project is deleted
    if (existingDocument.project?.isDeleted) {
      return NextResponse.json(
        {
          error: 'Cannot restore document',
          details: 'Parent project is deleted. Please restore the project first.',
        },
        { status: 400 }
      )
    }

    // Cascade restore: document + chat threads
    const result = await prisma.$transaction(async (tx) => {
      // 1. Restore all chat threads
      await tx.chatThread.updateMany({
        where: { documentId: id, isDeleted: true },
        data: { isDeleted: false, deletedAt: null },
      })

      // 2. Restore document
      return await tx.document.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              chatThreads: { where: { isDeleted: false } },
            },
          },
        },
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error restoring document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
