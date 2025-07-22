import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    // If email is provided, get specific user info
    if (email) {
      const userInfo = await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          email: true,
          username: true,
          imageUrl: true,
          createdAt: true,
        },
      })

      if (!userInfo) {
        return new NextResponse('User not found', { status: 404 })
      }

      return NextResponse.json(userInfo)
    }

    // Otherwise get current user info
    const userInfo = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        email: true,
        username: true,
        imageUrl: true,
        createdAt: true,
      },
    })

    if (!userInfo) {
      return new NextResponse('User not found', { status: 404 })
    }

    return NextResponse.json(userInfo)
  } catch (error) {
    console.error('[USER_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
