import { NextResponse } from 'next/server'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

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

    // 只有文档创建者才能归档文档（即使有协作者）
    if (existingDocument.userId !== session.user.id) {
      return new NextResponse('Only document owner can archive the document', {
        status: 403,
      })
    }

    const recursiveArchive = async (documentId: string) => {
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
            isArchived: true,
          },
        })
        await recursiveArchive(child.id)
      }
    }

    await prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        isArchived: true,
      },
    })

    await recursiveArchive(documentId)

    // 为协作者创建文档归档通知
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
                type: 'document_archived',
                title: `${currentUser?.name || '用户'} 归档了文档`,
                content: `文档《${existingDocument.title}》已被归档`,
                userId: collaboratorUser.id,
                documentId: documentId,
              },
            })
          }
        }
      }
    } catch (error) {
      console.error('Error creating document archive notifications:', error)
    }

    const updatedDocument = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error('[DOCUMENT_ARCHIVE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
