import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { autoDocumentGenerationService } from '@/libs/services/auto-document-generation-service'
import { prisma } from '@/libs/utils/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: requirementDocId } = await params

    const requirementDoc = await prisma.document.findFirst({
      where: {
        id: requirementDocId,
        documentType: 'REQUIREMENT',
        isDeleted: false,
      },
      include: {
        workspace: true,
      },
    })

    if (!requirementDoc) {
      return NextResponse.json({ error: 'Requirement document not found' }, { status: 404 })
    }

    if (requirementDoc.workspace.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!requirementDoc.content) {
      return NextResponse.json({ error: 'Requirement document has no content' }, { status: 400 })
    }

    const createdDocIds = await autoDocumentGenerationService.generateRelatedDocuments(requirementDocId)

    const createdDocuments = await prisma.document.findMany({
      where: {
        id: { in: createdDocIds },
      },
      select: {
        id: true,
        title: true,
        documentType: true,
      },
    })

    return NextResponse.json({
      success: true,
      documentsGenerated: createdDocuments.length,
      documents: createdDocuments,
    })
  } catch (error) {
    console.error('Error generating related documents:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate documents',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
