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

    // 更新用户的inbox查看时间
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { inboxLastViewedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      inboxLastViewedAt: user.inboxLastViewedAt,
    })
  } catch (error) {
    console.error('[MARK_INBOX_VIEWED]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
