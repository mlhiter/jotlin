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
    const { currentPhase, finalDocument } = await request.json()

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

    // 1. Save current phase document
    if (finalDocument && currentPhase) {
      const sourceChat = await prisma.chat.findFirst({
        where: {
          parentId: rootId,
          phase: currentPhase,
          isDeleted: false,
        },
        select: { id: true },
      })

      if (sourceChat) {
        await prisma.document.create({
          data: {
            chatId: rootId,
            phase: currentPhase,
            content: finalDocument,
            status: 'COMPLETED',
            sourceChatId: sourceChat.id,
          },
        })
      }
    }

    // 2. Create next phase chat
    let nextPhase: 'FEATURE_BENCHMARK' | 'MARKET_POSITIONING' | 'RECOMMENDATION'
    let nextTitle: string

    if (currentPhase === 'DISCOVERY') {
      nextPhase = 'FEATURE_BENCHMARK'
      nextTitle = `${rootChat.title || 'Project'} - Feature Benchmark`
    } else if (currentPhase === 'FEATURE_BENCHMARK') {
      nextPhase = 'MARKET_POSITIONING'
      nextTitle = `${rootChat.title || 'Project'} - Market Positioning`
    } else if (currentPhase === 'MARKET_POSITIONING') {
      nextPhase = 'RECOMMENDATION'
      nextTitle = `${rootChat.title || 'Project'} - Recommendations`
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
