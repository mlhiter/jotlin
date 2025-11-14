import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest, getUserMessageUsage } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'
import { runCompetitiveAnalysisWorkflow } from '@/src/mastra/workflows/competitive-analysis-workflow'

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const usage = await getUserMessageUsage(session.user.id)
    if (!usage.canSendMessage) {
      return NextResponse.json(
        {
          error: 'Message limit exceeded',
          details: {
            currentCount: usage.currentCount,
            limit: usage.limit,
            message: `You have reached your message limit of ${usage.limit}. Please contact support for more quota.`,
          },
        },
        { status: 429 }
      )
    }

    const { productIdea, chatId } = await req.json()

    if (!productIdea) {
      return NextResponse.json({ error: 'Product idea is required' }, { status: 400 })
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

    await prisma.chat.update({
      where: { id: chatId },
      data: { productIdea },
    })

    const results = await runCompetitiveAnalysisWorkflow(productIdea)

    const competitorIds = []
    const discoveryData = results.discovery as any
    if (discoveryData?.competitors) {
      for (const comp of discoveryData.competitors) {
        const competitor = await prisma.competitor.create({
          data: {
            name: comp.name,
            website: comp.website || null,
            source: 'AI',
          },
        })
        competitorIds.push(competitor.id)

        await prisma.competitorAnalysis.create({
          data: {
            chatId,
            competitorId: competitor.id,
            type: comp.type,
            confidence: comp.confidence,
            reasoning: comp.reasoning || null,
            status: 'COMPLETED',
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      competitorIds,
    })
  } catch (error: any) {
    console.error('[Competitive Analysis API Error]', error)
    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    )
  }
}
