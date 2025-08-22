import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function PUT(
  req: Request,
  { params }: { params: { invitationId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { invitationId } = params
    const { isAccepted } = await req.json()

    const existingInvitation = await prisma.invitation.findUnique({
      where: {
        id: invitationId,
      },
    })

    if (!existingInvitation) {
      return new NextResponse('Invitation not found', { status: 404 })
    }

    // Check if user is the invitee
    if (existingInvitation.collaboratorEmail !== session.user.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const updatedInvitation = await prisma.invitation.update({
      where: {
        id: invitationId,
      },
      data: {
        isReplied: true,
        isAccepted,
      },
    })

    if (isAccepted) {
      // Recursively update document collaborators
      const recursiveUpdate = async (documentId: string) => {
        const children = await prisma.document.findMany({
          where: {
            parentId: documentId,
          },
        })

        for (const child of children) {
          await prisma.documentCollaborator.create({
            data: {
              documentId: child.id,
              userEmail: session.user.email,
            },
          })
          await recursiveUpdate(child.id)
        }
      }

      // Update main document collaborator
      await prisma.documentCollaborator.create({
        data: {
          documentId: existingInvitation.documentId,
          userEmail: session.user.email,
        },
      })

      // Update child documents collaborators
      await recursiveUpdate(existingInvitation.documentId)
    }

    // Create notification for the inviter about the response
    try {
      // Find the inviter user
      const inviterUser = await prisma.user.findUnique({
        where: { email: existingInvitation.userEmail },
      })

      // Get document information
      const document = await prisma.document.findUnique({
        where: { id: existingInvitation.documentId },
        select: { title: true },
      })

      if (inviterUser && document) {
        const actionText = isAccepted ? 'accepted' : 'declined'
        await prisma.notification.create({
          data: {
            type: 'invitation_response',
            title: `Invitation ${actionText}`,
            content: `${session.user.email} has ${actionText} your invitation to collaborate on "${document.title}"`,
            userId: inviterUser.id,
            documentId: existingInvitation.documentId,
          },
        })
      }
    } catch (notificationError) {
      // Log the error but don't fail the invitation update
      console.error(
        'Failed to create notification for invitation response:',
        notificationError
      )
    }

    return NextResponse.json(updatedInvitation)
  } catch (error) {
    console.error('[INVITATION_UPDATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
