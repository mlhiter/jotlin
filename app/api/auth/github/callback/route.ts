import { NextRequest, NextResponse } from 'next/server'

import { createUser, createAuthSession } from '@/lib/auth'
import { githubOAuth } from '@/lib/github-oauth'

const redirectBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      const errorDescription = searchParams.get('error_description') || error
      console.error('GitHub OAuth error:', errorDescription)
      return NextResponse.redirect(`${redirectBaseUrl}/login?error=${encodeURIComponent(errorDescription)}`)
    }

    if (!code) {
      return NextResponse.redirect(`${redirectBaseUrl}/login?error=missing_code`)
    }

    // Verify and decode state parameter
    let stateData: { random: string; redirect: string; timestamp: number }
    try {
      if (!state) {
        return NextResponse.redirect(`${redirectBaseUrl}/login?error=missing_state`)
      }
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())

      // Check if state is not too old (10 minutes)
      if (Date.now() - stateData.timestamp > 600000) {
        return NextResponse.redirect(`${redirectBaseUrl}/login?error=state_expired`)
      }
    } catch (error) {
      return NextResponse.redirect(`${redirectBaseUrl}/login?error=invalid_state`)
    }

    // Get redirect URL from state
    const redirectUrl = stateData.redirect || '/chat'

    // Exchange code for user info
    const githubUser = await githubOAuth.authenticateWithCode(code)

    if (!githubUser.email) {
      return NextResponse.redirect(`${redirectBaseUrl}/login?error=no_email`)
    }

    // Create or update user
    const user = await createUser({
      id: githubUser.id.toString(),
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      name: githubUser.name || githubUser.login,
      email: githubUser.email,
      image: githubUser.avatar_url,
    })

    // Create auth session
    const token = await createAuthSession(user)

    // Redirect to client with token as query parameter (will be handled by client-side to store in localStorage)
    const response = NextResponse.redirect(`${redirectBaseUrl}${redirectUrl}?token=${encodeURIComponent(token)}`)

    return response
  } catch (error) {
    console.error('GitHub OAuth callback error:', error)
    return NextResponse.redirect(`${redirectBaseUrl}/login?error=auth_failed`)
  }
}
