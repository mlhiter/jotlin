import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { title, parentDocument } = await req.json()

    const document = await prisma.document.create({
      data: {
        title,
        parentId: parentDocument,
        userId: session.user.id,
        collaborators: {
          create: {
            userEmail: session.user.email,
          },
        },
      },
    })

    return NextResponse.json(document.id)
  } catch (error) {
    console.error('[DOCUMENTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const parentId = searchParams.get('parentDocument')
    const type = searchParams.get('type')

    if (!type) {
      return new NextResponse('Missing type parameter', { status: 400 })
    }

    let documents

    if (type === 'share') {
      documents = await prisma.document.findMany({
        where: {
          parentId,
          isArchived: false,
          collaborators: {
            some: {
              userEmail: session.user.email,
            },
          },
          AND: {
            collaborators: {
              some: {
                userEmail: {
                  not: session.user.email,
                },
              },
            },
          },
        },
        include: {
          collaborators: true,
        },
      })
    } else if (type === 'private') {
      documents = await prisma.document.findMany({
        where: {
          parentId,
          isArchived: false,
          userId: session.user.id,
          collaborators: {
            every: {
              userEmail: session.user.email,
            },
          },
        },
        include: {
          collaborators: true,
        },
      })
    } else {
      return new NextResponse('Invalid type parameter', { status: 400 })
    }

    return NextResponse.json(documents)
  } catch (error) {
    console.error('[DOCUMENTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
