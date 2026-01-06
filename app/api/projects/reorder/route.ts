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

    const { workspaceId, orders }: { workspaceId: string; orders: ReorderItem[] } = await request.json()

    // Validate: ensure all projects belong to current workspace and user
    const projectIds = orders.map((o) => o.id)
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: session.user.id,
        isDeleted: false,
      },
      include: {
        projects: {
          where: { id: { in: projectIds }, isDeleted: false },
          select: { id: true },
        },
      },
    })

    if (!workspace || workspace.projects.length !== projectIds.length) {
      return NextResponse.json({ error: 'Invalid project IDs' }, { status: 403 })
    }

    // Batch update using transaction
    await prisma.$transaction(
      orders.map(({ id, order }) =>
        prisma.project.update({
          where: { id },
          data: { order },
        })
      )
    )

    return NextResponse.json({ success: true, updated: orders.length })
  } catch (error) {
    console.error('Reorder projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
