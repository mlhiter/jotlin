import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

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
    const { title, description } = body

    if (!title) {
      return new NextResponse('Title is required', { status: 400 })
    }

    const chat = await prisma.chat.create({
      data: {
        title,
        description,
        userId: session.user.id,
      },
      include: {
        documents: true,
        messages: true,
      },
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('[CHAT_CREATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
