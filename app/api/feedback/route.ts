import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/lib/auth'
import { canAccessAdminPanel } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const body = await request.json()

    const { type, title, content, email, metadata } = body

    if (!type || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const feedback = await prisma.feedback.create({
      data: {
        type,
        title,
        content,
        email: session?.user?.email || email || null,
        userId: session?.user?.id || null,
        metadata,
      },
    })

    return NextResponse.json({ success: true, id: feedback.id })
  } catch (error) {
    console.error('Failed to create feedback:', error)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user || !canAccessAdminPanel(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json(feedbacks)
  } catch (error) {
    console.error('Failed to fetch feedbacks:', error)
    return NextResponse.json({ error: 'Failed to fetch feedbacks' }, { status: 500 })
  }
}
