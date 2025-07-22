import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const replaceTargetUrl = formData.get('replaceTargetUrl') as string

    if (!file) {
      return new NextResponse('No file found', { status: 400 })
    }

    // Delete old image if replacement is requested
    if (replaceTargetUrl) {
      const oldKey = replaceTargetUrl.split('/').pop()
      if (oldKey) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: oldKey,
          })
        )
      }
    }

    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}_${uuidv4()}.${fileExtension}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`

    // Save image record
    await prisma.image.create({
      data: {
        url,
        filename: fileName,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ url })
  } catch (error) {
    console.error('[IMAGE_UPLOAD]', error)
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
    const url = searchParams.get('url')

    if (!url) {
      return new NextResponse('URL is required', { status: 400 })
    }

    const fileName = url.split('/').pop()
    if (!fileName) {
      return new NextResponse('Invalid URL', { status: 400 })
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
      })
    )

    // Delete image record
    await prisma.image.deleteMany({
      where: {
        filename: fileName,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ message: 'ok' })
  } catch (error) {
    console.error('[IMAGE_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
