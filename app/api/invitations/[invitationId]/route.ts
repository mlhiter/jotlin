import { NextResponse } from 'next/server'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

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

    return NextResponse.json(updatedInvitation)
  } catch (error) {
    console.error('[INVITATION_UPDATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
