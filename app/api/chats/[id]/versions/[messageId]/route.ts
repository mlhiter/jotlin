import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getSessionFromRequest(req as NextRequest)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: chatId, messageId } = await params

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

    // Find the message to delete
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        chatId,
      },
    })

    if (!message) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Delete the message
    await prisma.message.delete({
      where: {
        id: messageId,
      },
    })

    return NextResponse.json({ success: true, message: 'Version deleted successfully' })
  } catch (error) {
    console.error('Failed to delete version:', error)
    return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 })
  }
}
