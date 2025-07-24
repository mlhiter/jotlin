import { NextResponse } from 'next/server'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

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
