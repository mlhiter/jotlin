import { NextRequest, NextResponse } from 'next/server'

import { findOrCreateUser, linkAccount } from '@/libs/auth/account'
import { createAuthSession } from '@/libs/auth/auth'
import { githubOAuth } from '@/libs/auth/github-oauth'
import { prisma } from '@/libs/utils/prisma'
import { uploadAvatar } from '@/libs/utils/s3'

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
      return NextResponse.redirect(`${redirectBaseUrl}/?error=${encodeURIComponent(errorDescription)}`)
    }

    if (!code) {
      return NextResponse.redirect(`${redirectBaseUrl}/?error=missing_code`)
    }

    // Verify and decode state parameter
    let stateData: { random: string; redirect: string; timestamp: number }
    try {
      if (!state) {
        return NextResponse.redirect(`${redirectBaseUrl}/?error=missing_state`)
      }
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())

      // Check if state is not too old (10 minutes)
      if (Date.now() - stateData.timestamp > 600000) {
        return NextResponse.redirect(`${redirectBaseUrl}/?error=state_expired`)
      }
    } catch {
      return NextResponse.redirect(`${redirectBaseUrl}/?error=invalid_state`)
    }

    // Get redirect URL from state
    const redirectUrl = stateData.redirect || '/chat'

    // Exchange code for user info
    const githubUser = await githubOAuth.authenticateWithCode(code)

    if (!githubUser.email) {
      return NextResponse.redirect(`${redirectBaseUrl}/?error=no_email`)
    }

    // Find or create user (based on email)
    let user = await findOrCreateUser(githubUser.email, {
      name: githubUser.name || githubUser.login,
      image: githubUser.avatar_url,
    })

    if (user.image && !user.image.includes(process.env.S3_ENDPOINT || '')) {
      const avatarUrl = await uploadAvatar(user.image)
      if (avatarUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { image: avatarUrl },
        })
      }
    }

    // Link GitHub account
    await linkAccount(user.id, 'github', githubUser.id.toString())

    // Create auth session
    const token = await createAuthSession(user)

    // Construct final redirect URL with token
    const separator = redirectUrl.includes('?') ? '&' : '?'
    const finalRedirectUrl = `${redirectBaseUrl}${redirectUrl}${separator}token=${encodeURIComponent(token)}`

    const response = NextResponse.redirect(finalRedirectUrl)

    return response
  } catch (error) {
    console.error('GitHub OAuth callback error:', error)
    return NextResponse.redirect(`${redirectBaseUrl}/?error=auth_failed`)
  }
}
