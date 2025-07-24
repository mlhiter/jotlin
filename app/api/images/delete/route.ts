import { NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { minioClient } from '@/libs/minio'

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

    await minioClient.removeObject(process.env.MINIO_BUCKET_NAME!, fileName)

    return NextResponse.json({ message: 'ok' })
  } catch (error) {
    console.error('[IMAGE_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
