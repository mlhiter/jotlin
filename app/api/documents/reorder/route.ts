import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

interface ReorderItem {
  id: string
  order: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, orders }: { projectId: string; orders: ReorderItem[] } = await request.json()

    // Validate: ensure project belongs to current user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        isDeleted: false,
      },
      include: {
        workspace: {
          select: { userId: true },
        },
      },
    })

    if (!project || project.workspace.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate: ensure all documents belong to this project
    const documentIds = orders.map((o) => o.id)
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        projectId,
        isDeleted: false,
      },
      select: { id: true },
    })

    if (documents.length !== documentIds.length) {
      return NextResponse.json({ error: 'Invalid document IDs' }, { status: 403 })
    }

    // Batch update using transaction
    await prisma.$transaction(
      orders.map(({ id, order }) =>
        prisma.document.update({
          where: { id },
          data: { order },
        })
      )
    )

    return NextResponse.json({ success: true, updated: orders.length })
  } catch (error) {
    console.error('Reorder documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
