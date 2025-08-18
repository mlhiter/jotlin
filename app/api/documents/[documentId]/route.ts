import { NextResponse } from 'next/server'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function GET(
  req: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { documentId } = params

    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      include: {
        collaborators: true,
      },
    })

    if (!document) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Check if user has access to the document (owner or collaborator)
    const hasAccess =
      document.userId === session.user.id ||
      document.collaborators.some(
        (collaborator) => collaborator.userEmail === session.user.email
      )

    if (!hasAccess) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('[DOCUMENT_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { documentId } = params
    const { chatId, ...data } = await req.json()

    const existingDocument = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
    })

    if (!existingDocument) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Check if user has permission to update the document
    const hasAccess = await prisma.documentCollaborator.findFirst({
      where: {
        documentId,
        userEmail: session.user.email,
      },
    })

    if (!hasAccess) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Update document and optionally link to chat
    const updatedData = chatId ? { ...data, chatId } : data

    const updatedDocument = await prisma.document.update({
      where: {
        id: documentId,
      },
      data: updatedData,
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error('[DOCUMENT_UPDATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { documentId: string } }
) {
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
    })

    if (!existingDocument) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Check if user has permission to delete the document
    const hasAccess = await prisma.documentCollaborator.findFirst({
      where: {
        documentId,
        userEmail: session.user.email,
      },
    })

    if (!hasAccess && existingDocument.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 为协作者创建文档删除通知
    try {
      // 获取当前用户信息
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true },
      })

      // 获取所有协作者（除当前用户外）
      const collaborators = await prisma.documentCollaborator.findMany({
        where: {
          documentId,
          userEmail: {
            not: session.user.email,
          },
        },
      })

      // 为每个协作者创建通知
      for (const collaborator of collaborators) {
        const collaboratorUser = await prisma.user.findUnique({
          where: { email: collaborator.userEmail },
          select: { id: true },
        })

        if (collaboratorUser) {
          await prisma.notification.create({
            data: {
              type: 'document_deleted',
              title: `${currentUser?.name || '用户'} 删除了文档`,
              content: `文档《${existingDocument.title}》已被删除`,
              userId: collaboratorUser.id,
              documentId: documentId,
            },
          })
        }
      }
    } catch (error) {
      console.error('Error creating document delete notifications:', error)
    }

    // First delete all collaborators
    await prisma.documentCollaborator.deleteMany({
      where: {
        documentId: documentId,
      },
    })

    // Then delete the document
    const deletedDocument = await prisma.document.delete({
      where: {
        id: documentId,
      },
    })

    return NextResponse.json(deletedDocument)
  } catch (error) {
    console.error('[DOCUMENT_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
