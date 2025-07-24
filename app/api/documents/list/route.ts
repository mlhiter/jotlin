import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const parentDocument = searchParams.get('parentDocumentId')
    const type = searchParams.get('type')

    if (!type || (type !== 'share' && type !== 'private')) {
      return NextResponse.json(
        { error: 'The type parameter is invalid.' },
        { status: 400 }
      )
    }

    const userEmail = session.user.email

    let documents

    if (type === 'share') {
      documents = await prisma.document.findMany({
        where: {
          parentId: parentDocument || null,
          isArchived: false,
          collaborators: {
            some: {
              userEmail: userEmail,
            },
          },
        },
        include: {
          collaborators: true,
        },
      })
      // Filter documents that have 2 or more collaborators
      documents = documents.filter((doc) => doc.collaborators.length >= 2)
    } else {
      documents = await prisma.document.findMany({
        where: {
          parentId: parentDocument || null,
          isArchived: false,
          user: {
            email: userEmail,
          },
          collaborators: {
            every: {
              userEmail: userEmail,
            },
          },
        },
      })
    }

    return NextResponse.json(documents)
  } catch (error) {
    console.error('[DOCUMENTS_SIDEBAR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
