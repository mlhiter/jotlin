import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'
import { extractDocumentContent, isVersionSnapshot, getVersionInfo } from '@/libs/utils/version-utils'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req as NextRequest)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: chatId } = await params

    // Get optional documentType filter from query params
    const url = new URL(req.url)
    const documentTypeFilter = url.searchParams.get('documentType')

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
      .filter((msg) => {
        if (!isVersionSnapshot(msg.metadata)) return false

        // Apply documentType filter if specified
        if (documentTypeFilter) {
          const versionInfo = getVersionInfo(msg.metadata)
          return versionInfo?.documentType === documentTypeFilter
        }

        return true
      })
      .map((msg) => {
        const versionInfo = getVersionInfo(msg.metadata)
        const allContent = extractDocumentContent(msg.parts)

        // Get content based on document type
        let content = ''
        if (versionInfo?.documentType) {
          const docType = versionInfo.documentType.toLowerCase()
          if (docType === 'requirement') {
            content = allContent.final || allContent.draft || ''
          } else if (docType === 'prd') {
            content = allContent.prd || ''
          } else if (docType === 'flowchart') {
            content = allContent.flowchart || ''
          } else if (docType === 'sitemap') {
            content = allContent.sitemap || ''
          } else if (docType === 'wireframe') {
            content = allContent.wireframe || ''
          }
        } else {
          // Fallback to old behavior for backward compatibility
          content = allContent.final || allContent.draft || ''
        }

        return {
          id: msg.id,
          title: versionInfo?.title || 'Untitled',
          type: versionInfo?.type || 'draft',
          phase: versionInfo?.phase,
          documentType: versionInfo?.documentType,
          versionGroupId: versionInfo?.versionGroupId,
          generatedFrom: versionInfo?.generatedFrom,
          content,
          preview: content.substring(0, 150),
          createdAt: msg.createdAt,
          metadata: msg.metadata,
        }
      })

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Failed to fetch versions:', error)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}
