'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

import { SingleImageDropzone } from '../single-image-dropzone'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'

import { upload } from '@/api/image'
import { updateDocument } from '@/api/document'
import { useDocumentStore } from '@/stores/document'
import { useCoverImage } from '@/stores/cover-image'

const CoverImageModal = () => {
  const params = useParams()
  const coverImage = useCoverImage()
  const [file, setFile] = useState<File>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setCurrentDocument } = useDocumentStore()

  const onClose = () => {
    setFile(undefined)
    setIsSubmitting(false)
    coverImage.onClose()
  }

  const onChange = async (file?: File) => {
    if (file) {
      setIsSubmitting(true)
      setFile(file)

      const res = await upload({
        file,
        replaceTargetUrl: coverImage.url,
      })
      const newDocument = await updateDocument({
        id: params.documentId as string,
        coverImage: res,
      })
      setCurrentDocument(newDocument)
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
