import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const {
      type,
      title,
      content,
      userId,
      priority,
      documentId,
      documentTitle,
      commentId,
      mentionId,
      invitationId,
      senderId,
      senderName,
      senderEmail,
    } = await req.json()

    if (!type || !title || !content || !userId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        content,
        userId,
        priority: priority || 'medium',
        documentId,
        documentTitle,
        commentId,
        mentionId,
        invitationId,
        senderId,
        senderName,
        senderEmail,
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('[NOTIFICATION_CREATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
