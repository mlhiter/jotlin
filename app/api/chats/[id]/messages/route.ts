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

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
        isDeleted: false,
      },
      select: {
        id: true,
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Clear existing messages
    await prisma.message.deleteMany({
      where: { chatId },
    })

    // Save new messages
    if (messages.length > 0) {
      await prisma.message.createMany({
        data: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          parts: msg.parts as InputJsonValue,
          metadata: msg.metadata as InputJsonValue,
          chatId,
        })),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save messages:', error)
    return NextResponse.json({ error: 'Failed to save messages' }, { status: 500 })
  }
}
