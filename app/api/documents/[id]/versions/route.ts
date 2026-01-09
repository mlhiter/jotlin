import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId } = await params

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

    // Fetch document versions (newest first, limit 50)
    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      take: 50,
      select: {
        id: true,
        documentId: true,
        versionNumber: true,
        content: true,
        createdBy: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Error fetching document versions:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
