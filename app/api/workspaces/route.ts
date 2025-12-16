import { NextRequest, NextResponse } from 'next/server'

import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let workspace = await prisma.workspace.findFirst({
      where: {
        userId: session.user.id,
        isDeleted: false,
      },
    })

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          userId: session.user.id,
          title: 'My Workspace',
          icon: '💼',
        },
      })
    }

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Failed to fetch workspace:', error)
    return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 })
  }
}
