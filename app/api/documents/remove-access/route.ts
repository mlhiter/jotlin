import { NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { documentId, collaboratorEmail } = await req.json()

    if (!documentId || !collaboratorEmail) {
      return new NextResponse('Document ID and collaborator email are required', { status: 400 })
    }

    // 查找文档及其协作者信息
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      include: {
        collaborators: true,
        user: true,
      },
    })

    if (!document) {
      return new NextResponse('Document not found', { status: 404 })
    }

    // 检查权限：文档创建者可以移除任何协作者，协作者只能移除自己
    const isOwner = document.userId === session.user.id
    const isSelfRemoving = collaboratorEmail === session.user.email

    if (!isOwner && !isSelfRemoving) {
      return new NextResponse('Unauthorized to remove this collaborator', {
        status: 403,
      })
    }

    // 检查被移除的用户是否确实是协作者
    const collaboratorExists = document.collaborators.some((collab) => collab.userEmail === collaboratorEmail)

    if (!collaboratorExists) {
      return new NextResponse('Collaborator not found in this document', {
        status: 404,
      })
    }

    // 不允许移除文档创建者（创建者总是有访问权限）
    if (collaboratorEmail === document.user.email) {
      return new NextResponse('Cannot remove document owner', { status: 400 })
    }

    // 递归移除协作者权限（包括子文档）
    const recursiveRemoveCollaborator = async (documentId: string) => {
      const children = await prisma.document.findMany({
        where: {
          parentId: documentId,
        },
      })

      // 移除子文档的协作者权限
      for (const child of children) {
        await prisma.documentCollaborator.deleteMany({
          where: {
            documentId: child.id,
            userEmail: collaboratorEmail,
          },
        })
        await recursiveRemoveCollaborator(child.id)
      }
    }

    // 移除主文档的协作者权限
    await prisma.documentCollaborator.deleteMany({
      where: {
        documentId: documentId,
        userEmail: collaboratorEmail,
      },
    })

    // 递归移除子文档的协作者权限
    await recursiveRemoveCollaborator(documentId)

    return NextResponse.json({
      message: 'Collaborator access removed successfully',
    })
  } catch (error) {
    console.error('[REMOVE_ACCESS]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
