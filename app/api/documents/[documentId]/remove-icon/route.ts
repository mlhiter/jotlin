import { prisma } from '@/libs/prisma'
import { auth } from '@/libs/auth'
import { NextResponse } from 'next/server'

export async function DELETE(
  req: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!params.documentId) {
      return new NextResponse('Document ID required', { status: 400 })
    }

    const existingDocument = await prisma.document.findUnique({
      where: {
        id: params.documentId,
      },
      include: {
        user: true,
      },
    })

    if (!existingDocument) {
      return new NextResponse('Not found', { status: 404 })
    }

    const userEmail = session.user.email

    if (existingDocument.user.email !== userEmail) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const document = await prisma.document.update({
      where: {
        id: params.documentId,
      },
      data: {
        icon: null,
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('[DOCUMENT_REMOVE_ICON]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
