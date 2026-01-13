import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { generationProgressStore } from '@/libs/services/generation-progress-store'
import { prisma } from '@/libs/utils/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const progress = generationProgressStore.get(requirementDocId)

    if (!progress) {
      return NextResponse.json({
        isGenerating: false,
        progress: null,
      })
    }

    return NextResponse.json({
      isGenerating: progress.status !== 'completed' && progress.status !== 'error',
      progress: {
        status: progress.status,
        currentStep: progress.currentStep,
        totalSteps: progress.totalSteps,
        completedSteps: progress.completedSteps,
        percentage: Math.round((progress.completedSteps / progress.totalSteps) * 100),
        generatedDocIds: progress.generatedDocIds,
        error: progress.error,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching generation status:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch generation status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
