import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: session.user.id,
        isDeleted: false,
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const projects = await prisma.project.findMany({
      where: {
        workspaceId,
        isDeleted: false,
      },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            documents: {
              where: { isDeleted: false },
            },
            chatThreads: {
              where: { isDeleted: false },
            },
          },
        },
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workspaceId, title, icon, description } = await req.json()

    if (!workspaceId || !title) {
      return NextResponse.json({ error: 'workspaceId and title are required' }, { status: 400 })
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: session.user.id,
        isDeleted: false,
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const maxOrder = await prisma.project.findFirst({
      where: { workspaceId, isDeleted: false },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const project = await prisma.project.create({
      data: {
        workspaceId,
        title,
        icon: icon || '📁',
        description,
        order: (maxOrder?.order ?? -1) + 1,
      },
    })

    await prisma.chatThread.create({
      data: {
        projectId: project.id,
        type: 'PROJECT',
        title: 'Initial Conversation',
      },
    })

    const projectWithCount = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        _count: {
          select: {
            documents: {
              where: { isDeleted: false },
            },
            chatThreads: {
              where: { isDeleted: false },
            },
          },
        },
      },
    })

    return NextResponse.json(projectWithCount)
  } catch (error) {
    console.error('Failed to create project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
