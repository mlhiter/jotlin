import { NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return new NextResponse('Email is required', { status: 400 })
    }

    const invitationsAsUser = await prisma.invitation.findMany({
      where: {
        userEmail: email,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const invitationsAsCollaborator = await prisma.invitation.findMany({
      where: {
        collaboratorEmail: email,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const invitations = [...invitationsAsUser, ...invitationsAsCollaborator]

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('[INVITATION_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
