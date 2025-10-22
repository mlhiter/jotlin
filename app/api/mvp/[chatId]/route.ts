import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params

    const mvp = await prisma.mvp.findUnique({
      where: { chatId },
    })

    if (!mvp) {
      return NextResponse.json({ error: 'MVP not found' }, { status: 404 })
    }

    return NextResponse.json(mvp)
  } catch (error) {
    console.error('[MVP] Failed to get MVP:', error)
    return NextResponse.json({ error: 'Failed to get MVP' }, { status: 500 })
  }
}
