import { NextResponse } from 'next/server'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { type, title, content, userId, documentId, commentId, mentionId } =
      await req.json()

    if (!type || !title || !content || !userId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        content,
        userId,
        documentId,
        commentId,
        mentionId,
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('[NOTIFICATION_CREATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
