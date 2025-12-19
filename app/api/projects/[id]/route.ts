import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

// GET /api/projects/[id] - Get project details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findFirst({
      where: {
        id,
        workspace: { userId: session.user.id },
        isDeleted: false,
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

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        workspace: { userId: session.user.id },
        isDeleted: false,
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.description !== undefined) updateData.description = body.description

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            documents: { where: { isDeleted: false } },
            chatThreads: { where: { isDeleted: false } },
          },
        },
      },
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Soft delete project
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        workspace: { userId: session.user.id },
      },
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Soft delete project
    const deletedProject = await prisma.project.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })

    return NextResponse.json(deletedProject)
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
