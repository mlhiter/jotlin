import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { documentId: string } }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { documentId } = params

    if (!documentId) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    // 检查用户是否有权限访问文档
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { userId: { in: await getUserIdsByEmail(session.user.email) } },
          { collaborators: { some: { userEmail: session.user.email } } },
        ],
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            image: true,
          },
        },
        collaborators: {
          select: { userEmail: true },
        },
      },
    })

    if (!document) {
      return new NextResponse('Document not found or access denied', {
        status: 404,
      })
    }

    // 获取所有协作者的完整用户信息
    const collaboratorEmails = [document.user.email, ...document.collaborators.map((c) => c.userEmail)]

    // 去重邮箱
    const uniqueEmails = Array.from(new Set(collaboratorEmails))

    // 批量获取用户信息
    const usersInfo = await prisma.user.findMany({
      where: {
        email: { in: uniqueEmails },
      },
      select: {
        email: true,
        name: true,
        image: true,
      },
    })

    // 构建协作者信息
    const collaboratorsWithInfo = usersInfo.map((user) => ({
      userEmail: user.email,
      userName: user.name,
      userImage: user.image,
    }))

    return NextResponse.json(collaboratorsWithInfo)
  } catch (error) {
    console.error('[COLLABORATORS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

async function getUserIdsByEmail(email: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  return user ? [user.id] : []
}
