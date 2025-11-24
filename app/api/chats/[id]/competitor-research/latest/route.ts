import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

import type { CompetitorResearchResponse, TavilySearchResponse } from '@/libs/types/competitor.types'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: chatId } = await params

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
        isDeleted: false,
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const latestResearch = await prisma.competitorResearch.findFirst({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
    })

    if (!latestResearch) {
      return NextResponse.json({ error: 'No research found' }, { status: 404 })
    }

    const response: CompetitorResearchResponse = {
      id: latestResearch.id,
      chatId: latestResearch.chatId,
      phase: latestResearch.phase as 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT',
      query: latestResearch.query,
      results: latestResearch.results as unknown as TavilySearchResponse,
      analysis: latestResearch.analysis as unknown as CompetitorAnalysis | undefined,
      status: latestResearch.status as 'pending' | 'processing' | 'completed' | 'failed',
      errorMessage: latestResearch.errorMessage || undefined,
      createdAt: latestResearch.createdAt.toISOString(),
      updatedAt: latestResearch.updatedAt.toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[CompetitorResearch] GET Latest Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
