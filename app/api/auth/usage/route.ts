import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest, getUserMessageUsage } from '@/libs/auth/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const usage = await getUserMessageUsage(session.user.id)
    return NextResponse.json(usage)
  } catch (error) {
    console.error('Failed to get usage:', error)
    return NextResponse.json({ error: 'Failed to get usage' }, { status: 500 })
  }
}
