import { POST, DELETE } from '@/libs/axios'

interface ImageUpload {
  file: File
  replaceTargetUrl?: string
}

export const imageApi = {
  upload: async ({ file, replaceTargetUrl }: ImageUpload) => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('replaceTargetUrl', replaceTargetUrl || '')

    const res = await POST('/api/images/upload', formData, {
      headers: {
        'Content-type': 'multipart/form-data',
      },
    })
    return res.url
  },

  delete: async (url: string) => {
    return DELETE(`/api/images/delete?url=${url}`)
  },
}
