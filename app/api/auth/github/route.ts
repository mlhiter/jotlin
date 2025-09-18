import { NextRequest, NextResponse } from 'next/server'

import { githubOAuth } from '@/lib/github-oauth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const redirectUrl = searchParams.get('redirect') || '/chat'

    // Generate state parameter for security and encode redirect URL in it
    const state = Buffer.from(
      JSON.stringify({
        random: Math.random().toString(36).substring(2, 15),
        redirect: redirectUrl,
        timestamp: Date.now(),
      })
    ).toString('base64')

    // Get authorization URL with encoded state
    const authUrl = githubOAuth.getAuthorizationUrl(state)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('GitHub OAuth initiation error:', error)
    return NextResponse.json({ error: 'Failed to initiate GitHub OAuth' }, { status: 500 })
  }
}
