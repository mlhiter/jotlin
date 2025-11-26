import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'
import { extractDraftContent, isVersionSnapshot, getVersionInfo } from '@/libs/utils/version-utils'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req as NextRequest)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: chatId } = await params

    // Verify chat ownership
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

    // Get all version snapshots for this chat
    const versionMessages = await prisma.message.findMany({
      where: {
        chatId,
        role: 'assistant',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Filter and transform version snapshots
    const versions = versionMessages
      .filter((msg) => isVersionSnapshot(msg.metadata))
      .map((msg) => {
        const versionInfo = getVersionInfo(msg.metadata)
        const { draft, final } = extractDraftContent(msg.parts)
        const content = final || draft || ''

        return {
          id: msg.id,
          title: versionInfo?.title || 'Untitled',
          type: versionInfo?.type || 'draft',
          phase: versionInfo?.phase,
          content,
          preview: content.substring(0, 150),
          createdAt: msg.createdAt,
        }
      })

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Failed to fetch versions:', error)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}
