export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB for images

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES]

export function isValidFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type)
}

export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_IMAGE_SIZE
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!isValidFileType(file)) {
    return { valid: false, error: 'Only images (JPG, PNG, WebP, GIF) are supported' }
  }

  if (!isValidFileSize(file)) {
    const maxSizeMB = MAX_IMAGE_SIZE / 1024 / 1024
    return { valid: false, error: `Image size exceeds ${maxSizeMB}MB limit` }
  }

  return { valid: true }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

export function isImageFile(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type)
}

export async function extractFileContent(file: File): Promise<{ content: string; truncated: boolean }> {
  if (isImageFile(file)) {
    // For images, return base64 data URL
    const base64 = await fileToBase64(file)
    return { content: base64, truncated: false }
  } else {
    throw new Error('Unsupported file type')
  }
}
