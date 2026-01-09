import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionNumber: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId, versionNumber: versionNumberStr } = await params
    const versionNumber = parseInt(versionNumberStr, 10)

    if (isNaN(versionNumber) || versionNumber < 1) {
      return NextResponse.json({ error: 'Invalid version number' }, { status: 400 })
    }

    // Verify user owns the workspace containing the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        workspace: { userId: session.user.id },
        isDeleted: false,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Transaction: Get target version + Create snapshot + Update document
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch target version
      const targetVersion = await tx.documentVersion.findUnique({
        where: {
          documentId_versionNumber: {
            documentId,
            versionNumber,
          },
        },
      })

      if (!targetVersion) {
        throw new Error(`Version ${versionNumber} not found`)
      }

      // 2. Create snapshot of current state (before restore)
      const newVersion = document.currentVersion + 1
      await tx.documentVersion.create({
        data: {
          documentId,
          content: document.content,
          versionNumber: newVersion,
          createdBy: 'restore-operation',
        },
      })

      // 3. Update document with restored content
      const restoredDocument = await tx.document.update({
        where: { id: documentId },
        data: {
          content: targetVersion.content,
          currentVersion: newVersion,
          lastEditedAt: new Date(),
        },
        include: {
          _count: {
            select: { chatThreads: true },
          },
        },
      })

      return restoredDocument
    })

    return NextResponse.json({
      success: true,
      document: result,
    })
  } catch (error) {
    console.error('Error restoring document version:', error)
    return NextResponse.json(
      {
        error: 'Failed to restore version',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
