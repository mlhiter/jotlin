import { NextRequest } from 'next/server'

import { User, AuthSession } from '@/schema/session'

import { prisma } from '../utils/prisma'

import { signJWT, verifyJWT } from './jwt'

export async function getUserById(id: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id },
  })
}

export async function createAuthSession(user: User): Promise<string> {
  const token = signJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  })

  return token
}

export async function getSessionFromToken(token: string): Promise<AuthSession | null> {
  const payload = verifyJWT(token)
  if (!payload) return null

  const user = await getUserById(payload.userId)
  if (!user) return null

  return { user, token }
}

export async function getSessionFromRequest(request: NextRequest): Promise<AuthSession | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  return getSessionFromToken(token)
}

export async function getSessionFromAuthHeader(authHeader: string | null): Promise<AuthSession | null> {
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  return getSessionFromToken(token)
}

export async function getUserMessageUsage(userId: string): Promise<{
  currentCount: number
  limit: number
  canSendMessage: boolean
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { messageLimit: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const workspace = await prisma.workspace.findFirst({
    where: { userId },
    select: { id: true },
  })

  if (!workspace) {
    return {
      currentCount: 0,
      limit: user.messageLimit,
      canSendMessage: true,
    }
  }

  const projectIds = await prisma.project.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true },
  })

  const threadIds = await prisma.chatThread.findMany({
    where: {
      OR: [
        { projectId: { in: projectIds.map((p) => p.id) } },
        {
          document: {
            workspaceId: workspace.id,
          },
        },
      ],
    },
    select: { id: true },
  })

  const currentCount = await prisma.chatMessage.count({
    where: {
      chatThreadId: { in: threadIds.map((t) => t.id) },
    },
  })

  return {
    currentCount,
    limit: user.messageLimit,
    canSendMessage: currentCount < user.messageLimit,
  }
}
