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

    // Create notification for the invited user
    try {
      // Find the invited user to get their user ID
      const invitedUser = await prisma.user.findUnique({
        where: { email: invitationData.collaboratorEmail },
      })

      // Get document information for the notification
      const document = await prisma.document.findUnique({
        where: { id: invitationData.documentId },
        select: { title: true },
      })

      if (invitedUser && document) {
        await prisma.notification.create({
          data: {
            type: 'invitation',
            title: 'New collaboration invitation',
            content: `You have been invited to collaborate on "${document.title}"`,
            userId: invitedUser.id,
            documentId: invitationData.documentId,
          },
        })
      }
    } catch (notificationError) {
      // Log the error but don't fail the invitation creation
      console.error(
        'Failed to create notification for invitation:',
        notificationError
      )
    }

    return NextResponse.json(invitation)
  } catch (error) {
    console.error('[INVITATION_CREATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
