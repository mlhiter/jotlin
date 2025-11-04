import { NextRequest, NextResponse } from 'next/server'

import { createUser, createAuthSession } from '@/libs/auth/auth'
import { googleOAuth } from '@/libs/auth/google-oauth'

const redirectBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      const errorDescription = searchParams.get('error_description') || error
      console.error('Google OAuth error:', errorDescription)
      return NextResponse.redirect(`${redirectBaseUrl}/?error=${encodeURIComponent(errorDescription)}`)
    }

    if (!code) {
      return NextResponse.redirect(`${redirectBaseUrl}/?error=missing_code`)
    }

    let stateData: { random: string; redirect: string; timestamp: number }
    try {
      if (!state) {
        return NextResponse.redirect(`${redirectBaseUrl}/?error=missing_state`)
      }
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())

      if (Date.now() - stateData.timestamp > 600000) {
        return NextResponse.redirect(`${redirectBaseUrl}/?error=state_expired`)
      }
    } catch {
      return NextResponse.redirect(`${redirectBaseUrl}/?error=invalid_state`)
    }

    const redirectUrl = stateData.redirect || '/chat'

    const googleUser = await googleOAuth.authenticateWithCode(code)

    if (!googleUser.email) {
      return NextResponse.redirect(`${redirectBaseUrl}/?error=no_email`)
    }

    const user = await createUser({
      id: googleUser.id,
      emailVerified: googleUser.verified_email,
      createdAt: new Date(),
      updatedAt: new Date(),
      name: googleUser.name,
      email: googleUser.email,
      image: googleUser.picture,
    })

    const token = await createAuthSession(user)

    const separator = redirectUrl.includes('?') ? '&' : '?'
    const finalRedirectUrl = `${redirectBaseUrl}${redirectUrl}${separator}token=${encodeURIComponent(token)}`

    const response = NextResponse.redirect(finalRedirectUrl)

    return response
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(`${redirectBaseUrl}/?error=auth_failed`)
  }
}
