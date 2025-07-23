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
    })

    if (!existingDocument) {
      return new NextResponse('Not found', { status: 404 })
    }

    if (existingDocument.userId !== session.user.id) {
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
