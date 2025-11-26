import { InputJsonValue } from '@prisma/client/runtime/library'
import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'
import { extractDraftContent, createVersionMetadata } from '@/libs/utils/version-utils'
import { MyUIMessage } from '@/schema/chat'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: chatId } = await params
    const { messages }: { messages: MyUIMessage[] } = await request.json()

    // Verify chat ownership and get phase info
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
        isDeleted: false,
      },
      select: {
        id: true,
        phase: true,
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Use transaction to ensure atomic delete + create
    await prisma.$transaction(async (tx) => {
      // Clear existing messages for this chat
      await tx.message.deleteMany({
        where: { chatId },
      })

      // Save new messages with version metadata
      if (messages.length > 0) {
        await tx.message.createMany({
          data: messages.map((msg, index) => {
            let metadata = msg.metadata as InputJsonValue

            // Mark all assistant messages that contain draft/final as version snapshots
            if (msg.role === 'assistant' && chat.phase) {
              const { draft, final } = extractDraftContent(msg.parts)
              const content = final || draft

              if (content) {
                const type = final ? 'final' : 'draft'
                metadata = createVersionMetadata(content, type, chat.phase) as InputJsonValue
              }
            }

            return {
              id: msg.id,
              role: msg.role,
              parts: msg.parts as InputJsonValue,
              metadata,
              chatId,
              order: index,
            }
          }),
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save messages:', error)
    return NextResponse.json({ error: 'Failed to save messages' }, { status: 500 })
  }
}
