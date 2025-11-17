import crypto from 'crypto'

import axios from 'axios'
import * as Minio from 'minio'

// Parse MinIO endpoint
const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000'
const endpointUrl = new URL(endpoint.startsWith('http') ? endpoint : `https://${endpoint}`)

const minioClient = new Minio.Client({
  endPoint: endpointUrl.hostname,
  port: parseInt(endpointUrl.port || (endpointUrl.protocol === 'https:' ? '443' : '9000')),
  useSSL: endpointUrl.protocol === 'https:',
  accessKey: process.env.S3_ACCESS_KEY!,
  secretKey: process.env.S3_SECRET_KEY!,
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME!
const PUBLIC_URL_BASE = process.env.S3_PUBLIC_URL || `${endpointUrl.protocol}//${endpointUrl.host}`

export async function uploadAvatar(imageUrl: string): Promise<string | null> {
  try {
    // Download the image using axios
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    })

    const imageBuffer = response.data
    const contentType = response.headers['content-type'] || 'image/jpeg'

    // Generate unique filename based on URL hash
    const hash = crypto.createHash('md5').update(imageUrl).digest('hex')
    const ext = contentType.split('/')[1] || 'jpg'
    const objectName = `avatars/${hash}.${ext}`

    // Upload to MinIO
    await minioClient.putObject(BUCKET_NAME, objectName, Buffer.from(imageBuffer), imageBuffer.byteLength, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    })

    // Return public URL
    const publicUrl = `${PUBLIC_URL_BASE}/${BUCKET_NAME}/${objectName}`
    return publicUrl
  } catch (error) {
    console.error('Failed to upload avatar to MinIO:', error)
    return null
  }
}
