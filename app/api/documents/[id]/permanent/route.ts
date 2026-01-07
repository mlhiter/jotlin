import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

// DELETE /api/documents/[id]/permanent - Permanently delete document (physical delete)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership and check if document is soft-deleted
    const existingDocument = await prisma.document.findFirst({
      where: {
        id,
        workspace: { userId: session.user.id },
        isDeleted: true, // Must be soft-deleted first
      },
    })

    if (!existingDocument) {
      return NextResponse.json({ error: 'Deleted document not found' }, { status: 404 })
    }

    // Physical delete - Prisma's onDelete: Cascade will automatically delete all related data
    await prisma.$transaction(async (tx) => {
      await tx.document.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error permanently deleting document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
