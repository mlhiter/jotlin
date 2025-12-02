import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { documentGenerationService } from '@/libs/services/document-generation-service'
import { prisma } from '@/libs/utils/prisma'
import { createVersionGroupId, extractDocumentTitle } from '@/libs/utils/version-utils'

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

    const requirementMetadata = requirementMessage.metadata as any
    if (!requirementMetadata?.isVersionSnapshot) {
      return NextResponse.json({ error: 'Message is not a version snapshot' }, { status: 400 })
    }

    const requirementParts = requirementMessage.parts as any[]
    const requirementText = requirementParts.find((p) => p.type === 'text')?.text || ''

    if (!requirementText) {
      return NextResponse.json({ error: 'Requirement message has no text content' }, { status: 400 })
    }

    const documents = await documentGenerationService.generateAllDocuments(requirementText)

    const versionGroupId = createVersionGroupId()
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
        parts: [{ type: 'text', text: `<prd>${documents.prd}</prd>` }],
        metadata: {
          isVersionSnapshot: true,
          versionTitle: extractDocumentTitle(documents.prd, 'PRD'),
          versionType: 'final',
          documentType: 'PRD',
          versionGroupId,
          generatedFrom: requirementMessageId,
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
          isVersionSnapshot: true,
          versionTitle: 'Business Flowchart',
          versionType: 'final',
          documentType: 'FLOWCHART',
          versionGroupId,
          generatedFrom: requirementMessageId,
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
          isVersionSnapshot: true,
          versionTitle: 'Site Structure Map',
          versionType: 'final',
          documentType: 'SITEMAP',
          versionGroupId,
          generatedFrom: requirementMessageId,
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
          isVersionSnapshot: true,
          versionTitle: 'UI Wireframe',
          versionType: 'final',
          documentType: 'WIREFRAME',
          versionGroupId,
          generatedFrom: requirementMessageId,
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
      versionGroupId,
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
