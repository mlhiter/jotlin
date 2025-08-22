import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string; documentId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
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
      return new NextResponse('Chat not found', { status: 404 })
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.documentId,
        userId: session.user.id,
      },
    })

    if (!document) {
      return new NextResponse('Document not found', { status: 404 })
    }

    const updatedDocument = await prisma.document.update({
      where: {
        id: params.documentId,
      },
      data: {
        chatId: params.chatId,
      },
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error('[LINK_DOCUMENT]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { chatId: string; documentId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
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
      return new NextResponse('Chat not found', { status: 404 })
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.documentId,
        chatId: params.chatId,
        userId: session.user.id,
      },
    })

    if (!document) {
      return new NextResponse('Document not found in this chat', {
        status: 404,
      })
    }

    const updatedDocument = await prisma.document.update({
      where: {
        id: params.documentId,
      },
      data: {
        chatId: null,
      },
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error('[UNLINK_DOCUMENT]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
