import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }: { params: { documentId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { documentId } = params

    const existingDocument = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      include: {
        collaborators: true,
      },
    })

    if (!existingDocument) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Check if user has permission to restore the document (owner or collaborator)
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { collaborators: true },
    })

    if (!document) {
      return new NextResponse('Document not found', { status: 404 })
    }

    const isOwner = document.userId === session.user.id
    const isCollaborator = document.collaborators.some((collaborator) => collaborator.userEmail === session.user.email)

    if (!isOwner && !isCollaborator) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const recursiveRestore = async (documentId: string) => {
      const children = await prisma.document.findMany({
        where: {
          parentId: documentId,
          userId: session.user.id,
        },
      })

      for (const child of children) {
        await prisma.document.update({
          where: {
            id: child.id,
          },
          data: {
            isArchived: false,
          },
        })
        await recursiveRestore(child.id)
      }
    }

    let parentArchived = false

    if (existingDocument.parentId) {
      const parent = await prisma.document.findUnique({
        where: {
          id: existingDocument.parentId,
        },
      })
      if (parent?.isArchived) {
        parentArchived = true
      }
    }

    await prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        isArchived: false,
        parentId: parentArchived ? null : existingDocument.parentId,
      },
    })

    await recursiveRestore(documentId)

    // 为协作者创建文档恢复通知
    try {
      // 获取当前用户信息
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true },
      })

      // 为所有协作者创建通知
      for (const collaborator of existingDocument.collaborators) {
        if (collaborator.userEmail !== session.user.email) {
          const collaboratorUser = await prisma.user.findUnique({
            where: { email: collaborator.userEmail },
            select: { id: true },
          })

          if (collaboratorUser) {
            await prisma.notification.create({
              data: {
                type: 'document_restored',
                title: `${currentUser?.name || '用户'} 恢复了文档`,
                content: `文档《${existingDocument.title}》已从归档中恢复`,
                userId: collaboratorUser.id,
                documentId: documentId,
              },
            })
          }
        }
      }
    } catch (error) {
      console.error('Error creating document restore notifications:', error)
    }

    const updatedDocument = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error('[DOCUMENT_RESTORE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
