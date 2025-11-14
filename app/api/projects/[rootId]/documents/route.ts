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
    const { phase, content, sourceChatId } = await request.json()

    if (!phase || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify root chat ownership
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

    // Check if document already exists
    const existingDoc = await prisma.document.findFirst({
      where: {
        chatId: rootId,
        phase,
      },
    })

    let document
    if (existingDoc) {
      // Update existing document
      document = await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          content,
          status: 'COMPLETED',
          sourceChatId: sourceChatId || existingDoc.sourceChatId,
        },
      })
    } else {
      // Create new document
      document = await prisma.document.create({
        data: {
          chatId: rootId,
          phase,
          content,
          status: 'COMPLETED',
          sourceChatId,
        },
      })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Failed to save document:', error)
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ rootId: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rootId } = await params

    // Get all documents for this project
    const documents = await prisma.document.findMany({
      where: {
        chatId: rootId,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Organize by phase
    const result = {
      requirement: documents.find((d) => d.phase === 'DISCOVERY') || null,
      architecture: documents.find((d) => d.phase === 'FEATURE_BENCHMARK') || null,
      development: documents.find((d) => d.phase === 'MARKET_POSITIONING') || null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch project documents:', error)
    return NextResponse.json({ error: 'Failed to fetch project documents' }, { status: 500 })
  }
}
