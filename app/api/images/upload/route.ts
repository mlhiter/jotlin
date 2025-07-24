import { NextResponse } from 'next/server'

import { minioClient } from '@/libs/minio'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File
    const replaceTargetUrl = formData.get('replaceTargetUrl') as string

    if (!file) {
      return new NextResponse('No file found', { status: 400 })
    }

    if (replaceTargetUrl) {
      try {
        const oldFileName = replaceTargetUrl.split('/').pop()
        if (oldFileName) {
          await minioClient.removeObject(
            process.env.MINIO_BUCKET_NAME!,
            oldFileName
          )
        }
      } catch (error) {
        console.error('Error removing old file:', error)
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`

    await minioClient.putObject(
      process.env.MINIO_BUCKET_NAME!,
      fileName,
      buffer,
      file.size,
      {
        'Content-Type': file.type,
      }
    )

    const fileUrl = `${process.env.MINIO_URL}/${process.env.MINIO_BUCKET_NAME}/${fileName}`

    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error('Error uploading file:', error)
    return new NextResponse('Error uploading file', { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '4mb',
  },
}
