import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { documentGenerationService } from '@/libs/services/document-generation-service'
import { prisma } from '@/libs/utils/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: chatId } = await params

    const body = await request.json()
    const { requirementMessageId } = body

    if (!requirementMessageId) {
      return NextResponse.json({ error: 'requirementMessageId is required' }, { status: 400 })
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

    const requirementMessage = await prisma.message.findFirst({
      where: {
        id: requirementMessageId,
        chatId,
      },
    })

    if (!requirementMessage) {
      return NextResponse.json({ error: 'Requirement message not found' }, { status: 404 })
    }

    const requirementParts = requirementMessage.parts as Array<{ type: string; text?: string }>
    const requirementText = requirementParts.find((p) => p.type === 'text')?.text || ''

    if (!requirementText) {
      return NextResponse.json({ error: 'Requirement message has no text content' }, { status: 400 })
    }

    const documents = await documentGenerationService.generateAllDocuments(requirementText)

    const now = new Date()

    const maxOrder = await prisma.message.findFirst({
      where: { chatId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    let nextOrder = (maxOrder?.order ?? 0) + 1

    const messagesToCreate = [
      {
        chatId,
        role: 'assistant' as const,
        parts: [{ type: 'text', text: `<product-document>${documents.productDocument}</product-document>` }],
        metadata: {
          answered: true,
          answeredAt: now.toISOString(),
        },
        order: nextOrder++,
        createdAt: now,
      },
      {
        chatId,
        role: 'assistant' as const,
        parts: [{ type: 'text', text: `<flowchart>${documents.flowchart}</flowchart>` }],
        metadata: {
          answered: true,
          answeredAt: now.toISOString(),
        },
        order: nextOrder++,
        createdAt: now,
      },
      {
        chatId,
        role: 'assistant' as const,
        parts: [{ type: 'text', text: `<sitemap>${documents.sitemap}</sitemap>` }],
        metadata: {
          answered: true,
          answeredAt: now.toISOString(),
        },
        order: nextOrder++,
        createdAt: now,
      },
      {
        chatId,
        role: 'assistant' as const,
        parts: [{ type: 'text', text: `<wireframe>${documents.wireframe}</wireframe>` }],
        metadata: {
          answered: true,
          answeredAt: now.toISOString(),
        },
        order: nextOrder++,
        createdAt: now,
      },
    ]

    await prisma.message.createMany({
      data: messagesToCreate,
    })

    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: now },
    })

    return NextResponse.json({
      success: true,
      documentsGenerated: 4,
    })
  } catch (error) {
    console.error('Error generating documents:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate documents',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
