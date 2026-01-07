import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

// POST /api/projects/[id]/restore - Restore deleted project
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership and check if project is deleted
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        workspace: { userId: session.user.id },
        isDeleted: true,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Deleted project not found' }, { status: 404 })
    }

    // Cascade restore: project + documents + chat threads
    const result = await prisma.$transaction(async (tx) => {
      // 1. Restore all documents
      await tx.document.updateMany({
        where: { projectId: id, isDeleted: true },
        data: { isDeleted: false, deletedAt: null },
      })

      // 2. Restore all chat threads
      await tx.chatThread.updateMany({
        where: { projectId: id, isDeleted: true },
        data: { isDeleted: false, deletedAt: null },
      })

      // 3. Restore project
      return await tx.project.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              documents: { where: { isDeleted: false } },
              chatThreads: { where: { isDeleted: false } },
            },
          },
        },
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error restoring project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
