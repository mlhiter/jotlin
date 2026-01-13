import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        isDeleted: false,
      },
      include: {
        workspace: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.workspace.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const latestRequirementDoc = await prisma.document.findFirst({
      where: {
        projectId,
        documentType: 'REQUIREMENT',
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      requirementDoc: latestRequirementDoc,
    })
  } catch (error) {
    console.error('Error fetching latest requirement:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch latest requirement',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
