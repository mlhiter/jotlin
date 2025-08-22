import { NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { title, parentDocument } = await req.json()

    // If parentDocument is provided, verify it exists
    if (parentDocument) {
      const parent = await prisma.document.findUnique({
        where: { id: parentDocument },
      })

      if (!parent) {
        return new NextResponse('Parent document not found', { status: 404 })
      }
    }

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
