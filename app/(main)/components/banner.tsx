'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import ConfirmModal from '@/components/modals/confirm-modal'
import { Button } from '@/components/ui/button'

import { documentApi } from '@/api/document'

interface BannerProps {
  documentId: string
}

const Banner = ({ documentId }: BannerProps) => {
  const router = useRouter()

  const onRemove = async () => {
    try {
      toast.loading('Deleting note...')

      await documentApi.remove(documentId)

      toast.success('Note deleted!')

      router.push('/documents')
    } catch (error) {
      toast.error('Failed to delete note.')
    }
  }
  const onRestore = async () => {
    try {
      toast.loading('Restoring note...')

      await documentApi.restore(documentId)

      toast.success('Note restored!')
    } catch (error) {
      toast.error('Failed to restore note.')
    }
  }

  return (
    <div className="flex w-full items-center justify-center gap-x-2 bg-rose-500 p-2 text-center text-sm text-white">
      <p> This page is in the Trash.</p>
      <Button
        size="sm"
        onClick={onRestore}
        variant="outline"
        className="h-auto border-white bg-transparent p-1 font-normal text-white hover:bg-primary/5 hover:text-white">
        Restore page
      </Button>
      <ConfirmModal onConfirm={onRemove}>
        <Button
          size="sm"
          variant="outline"
          className="h-auto border-white bg-transparent p-1 font-normal text-white hover:bg-primary/5 hover:text-white">
          Delete forever
        </Button>
      </ConfirmModal>
    </div>
  )
}

export default Banner
