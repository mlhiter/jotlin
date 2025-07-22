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
    const { ...data } = await req.json()

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

    const updatedDocument = await prisma.document.update({
      where: {
        id: documentId,
      },
      data,
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

    if (existingDocument.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

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
