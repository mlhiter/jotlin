import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session) {
      return NextResponse.json({ user: null, session: null }, { status: 401 })
    }

    return NextResponse.json({
      user: session.user,
      session: {
        token: session.token,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null, session: null }, { status: 401 })
  }
}
