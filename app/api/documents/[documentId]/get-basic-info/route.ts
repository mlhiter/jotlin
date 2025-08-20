import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!params.documentId) {
      return new NextResponse('Document ID is required', { status: 400 })
    }

    const document = await prisma.document.findUnique({
      where: {
        id: params.documentId,
      },
      select: {
        title: true,
        icon: true,
      },
    })

    if (!document) {
      return new NextResponse('Document not found', { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('[DOCUMENT_GET_BASIC_INFO]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
