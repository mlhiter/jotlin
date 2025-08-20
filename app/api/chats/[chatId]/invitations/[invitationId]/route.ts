import { NextResponse } from 'next/server'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function PUT(
  req: Request,
  { params }: { params: { chatId: string; invitationId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { invitationId } = params
    const { isAccepted } = await req.json()

    const existingInvitation = await prisma.chatInvitation.findUnique({
      where: { id: invitationId },
      include: {
        chat: {
          include: {
            documents: true,
          },
        },
      },
    })

    if (!existingInvitation) {
      return new NextResponse('Invitation not found', { status: 404 })
    }

    // Check if user is the invitee
    if (existingInvitation.collaboratorEmail !== session.user.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const updatedInvitation = await prisma.chatInvitation.update({
      where: { id: invitationId },
      data: {
        isReplied: true,
        isAccepted,
      },
    })

    if (isAccepted) {
      // Add user as chat collaborator
      await prisma.chatCollaborator.create({
        data: {
          chatId: existingInvitation.chatId,
          userEmail: session.user.email,
        },
      })

      // Also add user as collaborator to all associated documents
      if (existingInvitation.chat.documents.length > 0) {
        for (const document of existingInvitation.chat.documents) {
          // Check if user is not already a collaborator
          const existingDocCollaborator =
            await prisma.documentCollaborator.findUnique({
              where: {
                documentId_userEmail: {
                  documentId: document.id,
                  userEmail: session.user.email,
                },
              },
            })

          if (!existingDocCollaborator) {
            await prisma.documentCollaborator.create({
              data: {
                documentId: document.id,
                userEmail: session.user.email,
              },
            })
          }
        }
      }
    }

    // Create notification for the inviter about the response
    const inviterUser = await prisma.user.findUnique({
      where: { email: existingInvitation.userEmail },
    })

    if (inviterUser) {
      await prisma.notification.create({
        data: {
          type: 'chat_invitation_response',
          title: `Chat Invitation ${isAccepted ? 'Accepted' : 'Declined'}`,
          content: `${session.user.name || session.user.email} ${
            isAccepted ? 'accepted' : 'declined'
          } your invitation to collaborate on chat "${existingInvitation.chat.title}"`,
          userId: inviterUser.id,
          senderId: session.user.id,
          senderName: session.user.name,
          senderEmail: session.user.email,
        },
      })
    }

    return NextResponse.json(updatedInvitation)
  } catch (error) {
    console.error('Error updating chat invitation:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
