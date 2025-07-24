import { prisma } from '@/libs/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/libs/auth'

export async function DELETE(
  req: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const existingDocument = await prisma.document.findUnique({
      where: {
        id: params.documentId,
      },
    })

    if (!existingDocument) {
      return new NextResponse('Not found', { status: 404 })
    }

    if (existingDocument.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const document = await prisma.document.update({
      where: {
        id: params.documentId,
      },
      data: {
        coverImage: null,
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.log('[DOCUMENT_COVER_IMAGE_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
