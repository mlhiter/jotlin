import { NextResponse } from 'next/server'
import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function GET(
  req: Request,
  { params }: { params: { documentId: string } }
) {
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
          select: { email: true },
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

    // 返回所有协作者（包括文档所有者）
    const collaborators = [
      { userEmail: document.user.email },
      ...document.collaborators,
    ]

    // 去重
    const uniqueCollaborators = collaborators.filter(
      (collaborator, index, self) =>
        index === self.findIndex((c) => c.userEmail === collaborator.userEmail)
    )

    return NextResponse.json(uniqueCollaborators)
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
