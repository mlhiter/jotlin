import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    })

    if (!existingDocument) {
      return new NextResponse('Not found', { status: 404 })
    }

    if (existingDocument.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 递归归档当前文档及其子文档
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
