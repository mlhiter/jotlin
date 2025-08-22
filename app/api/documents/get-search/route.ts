import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const documents = await prisma.document.findMany({
      where: {
        userId: session.user.id,
        isArchived: false,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('[DOCUMENTS_GET_SEARCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
