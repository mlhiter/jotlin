import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mvps = await prisma.mvp.findMany({
      select: {
        id: true,
        chatId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        requirementSnapshot: true,
        files: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    return NextResponse.json({ mvps, count: mvps.length })
  } catch (error) {
    console.error('[MVP List] Error:', error)
    return NextResponse.json({ error: 'Failed to list MVPs' }, { status: 500 })
  }
}
