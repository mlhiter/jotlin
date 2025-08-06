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

    const chat = await prisma.chat.findUnique({
      where: {
        id: params.chatId,
        userId: session.user.id,
      },
      include: {
        documents: true,
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!chat) {
      return new NextResponse('Not found', { status: 404 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error('[CHAT_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PATCH(
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

    const body = await req.json()
    const { title, description, isArchived } = body

    const chat = await prisma.chat.update({
      where: {
        id: params.chatId,
        userId: session.user.id,
      },
      data: {
        title,
        description,
        isArchived,
      },
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('[CHAT_UPDATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(
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

    await prisma.message.deleteMany({
      where: {
        chatId: params.chatId,
      },
    })

    await prisma.document.updateMany({
      where: {
        chatId: params.chatId,
      },
      data: {
        chatId: null,
      },
    })

    const chat = await prisma.chat.delete({
      where: {
        id: params.chatId,
        userId: session.user.id,
      },
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('[CHAT_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
