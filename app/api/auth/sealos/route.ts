import { NextRequest, NextResponse } from 'next/server'

import { createUser, createAuthSession } from '@/lib/auth'
import { sealosAuth } from '@/lib/sealos-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sealosSession } = body

    if (!sealosSession) {
      return NextResponse.json({ error: 'Missing sealosSession' }, { status: 400 })
    }

    // Authenticate with Sealos
    const userData = await sealosAuth.authenticateUser(sealosSession)

    // Create or update user
    const user = await createUser(userData)

    // Create auth session (JWT token)
    const token = await createAuthSession(user)

    // Return token to client
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
  } catch (error) {
    console.error('Sealos auth error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'

    return NextResponse.json({ error: errorMessage }, { status: 401 })
  }
}
