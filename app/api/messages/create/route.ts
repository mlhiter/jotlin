import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    })

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { content, role, chatId } = body

    if (!content || !role || !chatId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      },
    })

    if (!chat) {
      return new NextResponse('Chat not found', { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        content,
        role,
        chatId,
        userId: session.user.id,
      },
    })

    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('[MESSAGE_CREATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
