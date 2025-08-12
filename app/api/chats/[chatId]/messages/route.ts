import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    })

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: params.chatId,
        userId: session.user.id,
        isDeleted: false,
      },
    })

    if (!chat) {
      return new NextResponse('Not found', { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId: params.chatId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('[CHAT_MESSAGES]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
