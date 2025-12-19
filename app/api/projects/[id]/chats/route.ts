import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get all phase chats for this project
    const phaseChats = await prisma.chat.findMany({
      where: {
        parentId: id,
        userId: session.user.id,
        isDeleted: false,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        messages: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(phaseChats)
  } catch (error) {
    console.error('Failed to fetch project chats:', error)
    return NextResponse.json({ error: 'Failed to fetch project chats' }, { status: 500 })
  }
}
