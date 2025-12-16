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
    const projectId = searchParams.get('projectId')
    const workspaceId = searchParams.get('workspaceId')

    if (!projectId && !workspaceId) {
      return NextResponse.json({ error: 'projectId or workspaceId is required' }, { status: 400 })
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId || undefined,
        userId: session.user.id,
        isDeleted: false,
      },
    })

    if (workspaceId && !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const documents = await prisma.document.findMany({
      where: {
        projectId: projectId || null,
        workspaceId: workspaceId || undefined,
        isDeleted: false,
      },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            chatThreads: {
              where: { isDeleted: false },
            },
          },
        },
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workspaceId, projectId, title, icon, documentType, content } = await req.json()

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

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          workspaceId,
          isDeleted: false,
        },
      })

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
    }

    const maxOrder = await prisma.document.findFirst({
      where: {
        projectId: projectId || null,
        workspaceId,
        isDeleted: false,
      },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const document = await prisma.document.create({
      data: {
        workspaceId,
        projectId: projectId || null,
        title,
        icon: icon || '📄',
        documentType: documentType || 'Custom',
        content: content || '',
        order: (maxOrder?.order ?? -1) + 1,
      },
    })

    await prisma.chatThread.create({
      data: {
        documentId: document.id,
        type: 'DOCUMENT',
        title: 'Document Chat',
      },
    })

    const documentWithCount = await prisma.document.findUnique({
      where: { id: document.id },
      include: {
        _count: {
          select: {
            chatThreads: {
              where: { isDeleted: false },
            },
          },
        },
      },
    })

    return NextResponse.json(documentWithCount)
  } catch (error) {
    console.error('Failed to create document:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
