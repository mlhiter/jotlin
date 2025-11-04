import { prisma } from '@/libs/utils/prisma'

import type { User } from '@prisma/client'

export type OAuthProvider = 'github' | 'google' | 'sealos'

export async function findOrCreateUser(
  email: string,
  userData: {
    name: string
    image?: string
  }
): Promise<User> {
  let user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: userData.name,
        image: userData.image,
        emailVerified: true,
      },
    })
  }

  return user
}

export async function linkAccount(userId: string, provider: OAuthProvider, providerAccountId: string): Promise<void> {
  await prisma.account.upsert({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
    update: {
      providerAccountId,
      updatedAt: new Date(),
    },
    create: {
      userId,
      provider,
      providerAccountId,
    },
  })
}

export async function getUserProviders(userId: string): Promise<OAuthProvider[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { provider: true },
  })

  return accounts.map((acc: { provider: string }) => acc.provider as OAuthProvider)
}

export async function hasProvider(userId: string, provider: OAuthProvider): Promise<boolean> {
  const account = await prisma.account.findUnique({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
  })

  return !!account
}

export async function unlinkAccount(userId: string, provider: OAuthProvider): Promise<void> {
  const accountCount = await prisma.account.count({
    where: { userId },
  })

  if (accountCount <= 1) {
    throw new Error('Cannot unlink the last authentication method')
  }

  await prisma.account.delete({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
  })
}
