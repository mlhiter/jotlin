import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { chatId } = params
    const { collaboratorEmail } = await req.json()

    // Check if chat exists and user is the owner or collaborator
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        user: true,
        collaborators: true,
      },
    })

    if (!chat) {
      return new NextResponse('Chat not found', { status: 404 })
    }

    // Check if user has permission to invite (owner or existing collaborator)
    const isOwner = chat.userId === session.user.id
    const isCollaborator = chat.collaborators.some((collaborator) => collaborator.userEmail === session.user.email)

    if (!isOwner && !isCollaborator) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if collaborator email is valid
    const collaboratorUser = await prisma.user.findUnique({
      where: { email: collaboratorEmail },
    })

    if (!collaboratorUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Check if user is trying to invite themselves
    if (collaboratorEmail === session.user.email) {
      return new NextResponse('Cannot invite yourself', { status: 400 })
    }

    // Check if collaborator is already added
    const existingCollaborator = await prisma.chatCollaborator.findUnique({
      where: {
        chatId_userEmail: {
          chatId,
          userEmail: collaboratorEmail,
        },
      },
    })

    if (existingCollaborator) {
      return new NextResponse('User is already a collaborator', { status: 400 })
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.chatInvitation.findFirst({
      where: {
        chatId,
        collaboratorEmail,
        isValid: true,
        isReplied: false,
      },
    })

    if (existingInvitation) {
      return new NextResponse('Invitation already sent', { status: 400 })
    }

    // Create invitation
    const invitation = await prisma.chatInvitation.create({
      data: {
        chatId,
        userEmail: session.user.email,
        collaboratorEmail,
      },
    })

    // Create notification for the invitee
    await prisma.notification.create({
      data: {
        type: 'chat_invitation',
        title: 'Chat Invitation',
        content: `${session.user.name || session.user.email} invited you to collaborate on chat "${chat.title}"`,
        userId: collaboratorUser.id,
        senderId: session.user.id,
        senderName: session.user.name,
        senderEmail: session.user.email,
      },
    })

    return NextResponse.json(invitation)
  } catch (error) {
    console.error('Error creating chat invitation:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
