import { InputJsonValue } from '@prisma/client/runtime/library'
import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'
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

      // Save new messages
      if (messages.length > 0) {
        await tx.message.createMany({
          data: messages.map((msg, index) => ({
            id: msg.id,
            role: msg.role,
            parts: msg.parts as InputJsonValue,
            metadata: msg.metadata as InputJsonValue,
            chatId,
            order: index,
          })),
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save messages:', error)
    return NextResponse.json({ error: 'Failed to save messages' }, { status: 500 })
  }
}
