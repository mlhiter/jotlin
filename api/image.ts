import axios from '@/lib/axios'

interface ImageUpload {
  file: File
  replaceTargetUrl?: string
}

export const upload = async ({ file, replaceTargetUrl }: ImageUpload) => {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('replaceTargetUrl', replaceTargetUrl || '')

  const res = await axios.post('/api/image/upload', formData, {
    headers: {
      'Content-type': 'multipart/form-data',
    },
  })
  return res.data
}

export const deleteImage = (url: string) => {
  return axios.delete(`/api/image/delete?url=${url}`)
}
