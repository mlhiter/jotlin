import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

// GET /api/trash?workspaceId={id} - Get deleted projects and documents
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    // Verify workspace ownership
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: session.user.id },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Fetch deleted projects, documents, and chat threads in parallel
    const [deletedProjects, deletedDocuments, deletedChatThreads] = await Promise.all([
      // Deleted projects (with counts)
      prisma.project.findMany({
        where: {
          workspaceId,
          isDeleted: true,
        },
        include: {
          _count: {
            select: {
              documents: { where: { isDeleted: true } },
              chatThreads: { where: { isDeleted: true } },
            },
          },
        },
        orderBy: { deletedAt: 'desc' },
      }),

      // Deleted documents (only show independently deleted ones, not cascaded from projects)
      prisma.document.findMany({
        where: {
          workspaceId,
          isDeleted: true,
          OR: [
            { projectId: null }, // Orphaned documents
            { project: { isDeleted: false } }, // Documents whose parent project is not deleted
          ],
        },
        include: {
          project: {
            select: { id: true, title: true, icon: true },
          },
          _count: {
            select: {
              chatThreads: { where: { isDeleted: true } },
            },
          },
        },
        orderBy: { deletedAt: 'desc' },
      }),

      // Deleted chat threads (only show independently deleted ones, not cascaded)
      prisma.chatThread.findMany({
        where: {
          isDeleted: true,
          OR: [
            // Project-level threads whose parent project is not deleted
            {
              projectId: { not: null },
              project: {
                workspaceId,
                isDeleted: false,
              },
            },
            // Document-level threads whose parent document is not deleted
            {
              documentId: { not: null },
              document: {
                workspaceId,
                isDeleted: false,
                // Also check that the document's parent project (if any) is not deleted
                OR: [
                  { projectId: null },
                  { project: { isDeleted: false } },
                ],
              },
            },
          ],
        },
        include: {
          project: {
            select: { id: true, title: true, icon: true },
          },
          document: {
            select: { id: true, title: true, icon: true, documentType: true },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { deletedAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      projects: deletedProjects,
      documents: deletedDocuments,
      chatThreads: deletedChatThreads,
    })
  } catch (error) {
    console.error('Error fetching trash items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
