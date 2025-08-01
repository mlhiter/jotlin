import { NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { documentId, content, blockId } = await req.json()

    if (!documentId || !content || !blockId) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        blockId,
        documentId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('[COMMENTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get('id')

    if (!commentId) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    // 获取评论信息以检查权限
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true },
    })

    if (!comment) {
      return new NextResponse('Comment not found', { status: 404 })
    }

    // 只允许评论作者删除评论
    if (comment.user.email !== session.user.email) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // 删除评论
    await prisma.comment.delete({
      where: { id: commentId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[COMMENTS_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get('id')
    const { content } = await req.json()

    if (!commentId || !content) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    // 获取评论信息以检查权限
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true },
    })

    if (!comment) {
      return new NextResponse('Comment not found', { status: 404 })
    }

    // 只允许评论作者编辑评论
    if (comment.user.email !== session.user.email) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // 更新评论
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('[COMMENTS_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    const comments = await prisma.comment.findMany({
      where: {
        documentId,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('[COMMENTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
