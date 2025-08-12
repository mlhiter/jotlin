import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    })

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const chats = await prisma.chat.findMany({
      where: {
        userId: session.user.id,
        isDeleted: false,
      },
      include: {
        documents: {
          select: {
            id: true,
            title: true,
            icon: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(chats)
  } catch (error) {
    console.error('[CHATS_LIST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}