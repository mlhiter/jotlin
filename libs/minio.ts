import * as Minio from 'minio'

export const minioClient = new Minio.Client({
  endPoint: process.env
    .MINIO_URL!.replace('http://', '')
    .replace('https://', ''),
  port: 443,
  useSSL: process.env.MINIO_URL!.startsWith('https'),
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
})
