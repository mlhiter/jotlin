import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { auth } from '@/libs/auth'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    })

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { userRequirement } = body

    if (!userRequirement) {
      return new NextResponse('User requirement is required', { status: 400 })
    }

    // Call the backend agent server to generate title
    const agentServerUrl =
      process.env.AGENT_SERVER_URL || 'http://localhost:8000'

    const response = await fetch(`${agentServerUrl}/api/generate-chat-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_requirement: userRequirement,
      }),
    })

    if (!response.ok) {
      console.error(
        'Failed to generate title from agent server:',
        response.statusText
      )
      // Fallback to a simple title
      return NextResponse.json({
        title:
          userRequirement.length > 50
            ? userRequirement.substring(0, 47) + '...'
            : userRequirement,
      })
    }

    const data = await response.json()
    return NextResponse.json({ title: data.title })
  } catch (error) {
    console.error('[CHAT_TITLE_GENERATION]', error)

    // Fallback: use the user requirement as title if it's short enough
    try {
      const body = await req.json()
      const { userRequirement } = body
      const fallbackTitle =
        userRequirement && userRequirement.length > 0
          ? userRequirement.length > 50
            ? userRequirement.substring(0, 47) + '...'
            : userRequirement
          : 'New chat'

      return NextResponse.json({ title: fallbackTitle })
    } catch {
      return NextResponse.json({ title: 'New chat' })
    }
  }
}
