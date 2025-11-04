import { NextRequest, NextResponse } from 'next/server'

import { googleOAuth } from '@/libs/auth/google-oauth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const redirectUrl = searchParams.get('redirect') || '/chat'

    const state = Buffer.from(
      JSON.stringify({
        random: Math.random().toString(36).substring(2, 15),
        redirect: redirectUrl,
        timestamp: Date.now(),
      })
    ).toString('base64')

    const authUrl = googleOAuth.getAuthorizationUrl(state)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Google OAuth initiation error:', error)
    return NextResponse.json({ error: 'Failed to initiate Google OAuth' }, { status: 500 })
  }
}
