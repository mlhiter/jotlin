import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const invitationData = await req.json()

    // check if the invitation already exists
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        ...invitationData,
        isValid: true,
        isReplied: false,
      },
    })

    if (existingInvitation) {
      return new NextResponse("Don't create same invitation repeatedly", {
        status: 400,
      })
    }

    const invitation = await prisma.invitation.create({
      data: {
        ...invitationData,
        isAccepted: false,
        isReplied: false,
        isValid: true,
        createdAt: new Date(),
      },
    })

    return NextResponse.json(invitation)
  } catch (error) {
    console.error('[INVITATION_CREATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

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
