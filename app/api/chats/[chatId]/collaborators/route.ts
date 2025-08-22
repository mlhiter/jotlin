import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { chatId } = params

    // Check if chat exists and user has access to it
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

    // Check if user has access to this chat (owner or collaborator)
    const isOwner = chat.userId === session.user.id
    const isCollaborator = chat.collaborators.some(
      (collaborator) => collaborator.userEmail === session.user.email
    )

    if (!isOwner && !isCollaborator) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get all collaborators including the owner
    const collaboratorsInfo = []

    // Add the owner first
    const ownerUser = await prisma.user.findUnique({
      where: { id: chat.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    })

    if (ownerUser) {
      collaboratorsInfo.push({
        userEmail: ownerUser.email,
        user: ownerUser,
        isOwner: true,
        createdAt: chat.createdAt,
      })
    }

    // Add collaborators
    for (const collaborator of chat.collaborators) {
      const collaboratorUser = await prisma.user.findUnique({
        where: { email: collaborator.userEmail },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      })

      if (collaboratorUser) {
        collaboratorsInfo.push({
          userEmail: collaborator.userEmail,
          user: collaboratorUser,
          isOwner: false,
          createdAt: collaborator.createdAt,
        })
      }
    }

    return NextResponse.json(collaboratorsInfo)
  } catch (error) {
    console.error('Error fetching chat collaborators:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { chatId } = params
    const { collaboratorEmail } = await req.json()

    // Check if chat exists and user is the owner
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        user: true,
        documents: true,
      },
    })

    if (!chat) {
      return new NextResponse('Chat not found', { status: 404 })
    }

    // Only owner can remove collaborators
    if (chat.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Cannot remove the owner
    if (collaboratorEmail === chat.user.email) {
      return new NextResponse('Cannot remove the owner', { status: 400 })
    }

    // Remove chat collaborator
    await prisma.chatCollaborator.deleteMany({
      where: {
        chatId,
        userEmail: collaboratorEmail,
      },
    })

    // Also remove from associated documents
    if (chat.documents.length > 0) {
      for (const document of chat.documents) {
        await prisma.documentCollaborator.deleteMany({
          where: {
            documentId: document.id,
            userEmail: collaboratorEmail,
          },
        })
      }
    }

    // Create notification for the removed collaborator
    const removedUser = await prisma.user.findUnique({
      where: { email: collaboratorEmail },
    })

    if (removedUser) {
      await prisma.notification.create({
        data: {
          type: 'chat_access_removed',
          title: 'Chat Access Removed',
          content: `You have been removed from chat "${chat.title}"`,
          userId: removedUser.id,
          senderId: session.user.id,
          senderName: session.user.name,
          senderEmail: session.user.email,
        },
      })
    }

    return new NextResponse('Collaborator removed successfully', {
      status: 200,
    })
  } catch (error) {
    console.error('Error removing chat collaborator:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
