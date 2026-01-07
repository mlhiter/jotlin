import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const document = await prisma.document.findFirst({
      where: {
        id,
        workspace: { userId: session.user.id },
        isDeleted: false,
      },
      include: {
        _count: {
          select: { chatThreads: true },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      console.error('PATCH /api/documents/[id]: Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existingDocument = await prisma.document.findFirst({
      where: {
        id,
        workspace: { userId: session.user.id },
        isDeleted: false,
      },
    })

    if (!existingDocument) {
      console.error('PATCH /api/documents/[id]: Document not found', { id, userId: session.user.id })
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const updateData: any = {
      lastEditedAt: new Date(),
    }

    if (body.content !== undefined) updateData.content = body.content
    if (body.title !== undefined) updateData.title = body.title
    if (body.documentType !== undefined) updateData.documentType = body.documentType
    if (body.icon !== undefined) updateData.icon = body.icon

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { chatThreads: true },
        },
      },
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingDocument = await prisma.document.findFirst({
      where: {
        id,
        workspace: { userId: session.user.id },
      },
    })

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const now = new Date()

    // Cascade soft delete: document + chat threads
    const result = await prisma.$transaction(async (tx) => {
      // 1. Soft delete all document-level chat threads
      await tx.chatThread.updateMany({
        where: { documentId: id, isDeleted: false },
        data: { isDeleted: true, deletedAt: now },
      })

      // 2. Soft delete document
      return await tx.document.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: now,
        },
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
