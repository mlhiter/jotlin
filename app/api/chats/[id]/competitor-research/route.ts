import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { CompetitorAnalysisService } from '@/libs/services/competitor-analysis-service'
import { KeywordExtractionService } from '@/libs/services/keyword-extraction-service'
import { getTavilyService } from '@/libs/services/tavily-service'
import { prisma } from '@/libs/utils/prisma'

import type {
  CompetitorResearchRequest,
  CompetitorResearchResponse,
  KeywordExtractionResult,
  TavilySearchResponse,
  CompetitorAnalysis,
} from '@/libs/types/competitor.types'
import type { MyUIMessage } from '@/schema/chat'

async function processCompetitorResearch(researchId: string, searchQuery: string) {
  try {
    await prisma.competitorResearch.update({
      where: { id: researchId },
      data: { status: 'processing' },
    })

    const tavilyService = getTavilyService()
    const searchResults = await tavilyService.search({
      query: searchQuery,
      searchDepth: 'advanced',
      maxResults: 10,
      excludeDomains: ['baidu.com', 'zhihu.com', 'csdn.net', 'jianshu.com', 'cnblogs.com'],
    })

    const analysisService = new CompetitorAnalysisService()
    const analysis = await analysisService.analyzeCompetitors(searchResults)

    await prisma.competitorResearch.update({
      where: { id: researchId },
      data: {
        results: searchResults as unknown as Prisma.InputJsonValue,
        analysis: analysis as unknown as Prisma.InputJsonValue,
        status: 'completed',
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Search failed'
    await prisma.competitorResearch.update({
      where: { id: researchId },
      data: {
        status: 'failed',
        errorMessage,
      },
    })
    throw error
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: chatId } = await params

    let body: CompetitorResearchRequest = { chatId }
    try {
      const requestBody = await request.json()
      body = { ...body, ...requestBody }
    } catch {
      // No body or invalid JSON, use defaults
    }

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

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { order: 'asc' },
    })

    const keywordService = new KeywordExtractionService()
    let keywords: KeywordExtractionResult

    if (body.manualQuery) {
      keywords = {
        primaryKeywords: [body.manualQuery],
        searchQuery: body.manualQuery,
        confidence: 1.0,
      }
    } else {
      try {
        keywords = await keywordService.extractFromConversation(messages as unknown as MyUIMessage[])
      } catch (error) {
        console.warn('[CompetitorResearch] Keyword extraction failed, using fallback', error)
        keywords = {
          primaryKeywords: ['product', 'features'],
          searchQuery: 'similar products features comparison',
          confidence: 0.5,
        }
      }
    }

    const research = await prisma.competitorResearch.create({
      data: {
        chatId,
        phase: chat.phase || 'REQUIREMENT',
        query: keywords.searchQuery,
        results: {},
        status: 'pending',
      },
    })

    // Start background processing (don't await)
    processCompetitorResearch(research.id, keywords.searchQuery).catch((error) => {
      console.error('[CompetitorResearch] Background processing failed:', error)
    })

    // Return immediately with pending status
    const response: CompetitorResearchResponse = {
      id: research.id,
      chatId: research.chatId,
      phase: research.phase as 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT',
      query: research.query,
      results: { query: keywords.searchQuery, results: [], response_time: 0 },
      status: 'pending',
      createdAt: research.createdAt.toISOString(),
      updatedAt: research.updatedAt.toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[CompetitorResearch] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const researches = await prisma.competitorResearch.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
    })

    const response = researches.map((r) => ({
      id: r.id,
      chatId: r.chatId,
      phase: r.phase as 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT',
      query: r.query,
      results: r.results as unknown as TavilySearchResponse,
      analysis: r.analysis as unknown as CompetitorAnalysis | undefined,
      status: r.status as 'pending' | 'processing' | 'completed' | 'failed',
      errorMessage: r.errorMessage || undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('[CompetitorResearch] GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
