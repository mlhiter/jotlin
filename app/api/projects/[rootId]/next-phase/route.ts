import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ rootId: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rootId } = await params
    const { currentPhase } = await request.json()

    // Verify root chat exists
    const rootChat = await prisma.chat.findFirst({
      where: {
        id: rootId,
        userId: session.user.id,
        isDeleted: false,
        parentId: null,
        phase: null,
      },
    })

    if (!rootChat) {
      return NextResponse.json({ error: 'Root chat not found' }, { status: 404 })
    }

    // Create next phase chat
    let nextPhase: 'ARCHITECTURE' | 'DEVELOPMENT'
    let nextTitle: string

    if (currentPhase === 'REQUIREMENT') {
      nextPhase = 'ARCHITECTURE'
      nextTitle = `${rootChat.title || 'Project'} - Architecture`
    } else if (currentPhase === 'ARCHITECTURE') {
      nextPhase = 'DEVELOPMENT'
      nextTitle = `${rootChat.title || 'Project'} - Development`
    } else {
      return NextResponse.json({ error: 'Invalid phase transition' }, { status: 400 })
    }

    const nextPhaseChat = await prisma.chat.create({
      data: {
        title: nextTitle,
        userId: session.user.id,
        parentId: rootId,
        phase: nextPhase,
      },
    })

    return NextResponse.json({
      nextPhaseChat,
      nextPhase,
    })
  } catch (error) {
    console.error('Failed to transition phase:', error)
    return NextResponse.json({ error: 'Failed to transition phase' }, { status: 500 })
  }
}
