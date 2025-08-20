'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'

import { imageApi } from '@/api/image'
import { useDocumentActions } from '@/hooks/use-document-actions'
import { useCoverImage } from '@/stores/cover-image'

import { SingleImageDropzone } from '../single-image-dropzone'

const CoverImageModal = () => {
  const params = useParams()
  const coverImage = useCoverImage()
  const [file, setFile] = useState<File>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateDocument } = useDocumentActions()

  const onClose = () => {
    setFile(undefined)
    setIsSubmitting(false)
    coverImage.onClose()
  }

  const onChange = async (file?: File) => {
    if (file) {
      setIsSubmitting(true)
      setFile(file)

      const res = await imageApi.upload({
        file,
        replaceTargetUrl: coverImage.url,
      })
      await updateDocument({
        id: params.documentId as string,
        coverImage: res,
      })
    }
    onClose()
  }

  return (
    <Dialog open={coverImage.isOpen} onOpenChange={coverImage.onClose}>
      <DialogContent>
        <DialogHeader>
          <h2 className="text-center text-lg font-semibold">Cover Image</h2>
        </DialogHeader>
        <SingleImageDropzone
          className="w-full outline-none"
          disabled={isSubmitting}
          value={file}
          onChange={onChange}
        />
      </DialogContent>
    </Dialog>
  )
}

export default CoverImageModal
