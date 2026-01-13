import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { autoDocumentGenerationService } from '@/libs/services/auto-document-generation-service'
import { prisma } from '@/libs/utils/prisma'

/**
 * Manual trigger endpoint for testing auto-generation
 * POST /api/documents/[id]/trigger-generation
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: requirementDocId } = await params

    // Verify the document exists and is a REQUIREMENT
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

    console.log('[Manual Trigger] Triggering auto-generation for:', requirementDocId)

    // Trigger auto-generation
    autoDocumentGenerationService.triggerAutoGeneration(requirementDocId)

    return NextResponse.json({
      success: true,
      message: 'Auto-generation triggered successfully',
      requirementDocId,
    })
  } catch (error) {
    console.error('[Manual Trigger] Failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to trigger auto-generation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
