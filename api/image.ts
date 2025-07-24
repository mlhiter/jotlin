import { POST, DELETE } from '@/libs/axios'

interface ImageUpload {
  file: File
  replaceTargetUrl?: string
}

export const uploadImage = async ({ file, replaceTargetUrl }: ImageUpload) => {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('replaceTargetUrl', replaceTargetUrl || '')

  const res = await POST('/api/images/upload', formData, {
    headers: {
      'Content-type': 'multipart/form-data',
    },
  })
  return res.url
}

export const deleteImage = (url: string) =>
  DELETE(`/api/images/delete?url=${url}`)
