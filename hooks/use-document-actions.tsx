import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

import { documentApi } from '@/api/document'
import { Doc } from '@/types/document'
import { useDocumentStore } from '@/stores/document'

export const useDocumentActions = () => {
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const { setCurrentDocument } = useDocumentStore()

  const invalidateDocumentQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ['documents'],
      // This will match any query key that starts with ['documents']
      exact: false,
    })
  }
  const invalidateTrashDocumentQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ['trash-documents'],
      exact: false,
    })
  }

  const archiveDocument = async (id: string) => {
    try {
      toast.loading('Moving to trash...')
      await documentApi.archive(id)
      router.push('/documents')
      invalidateDocumentQueries()
      toast.success('Note moved to trash!')
    } catch (error) {
      toast.error('Failed to archive note.')
    }
  }

  const createDocument = async (parentDocumentId?: string) => {
    try {
      const documentId = await documentApi.create({
        title: 'Untitled',
        parentDocument: parentDocumentId ?? null,
      })
      router.push(`/documents/${documentId}`)
      invalidateDocumentQueries()
    } catch (error) {
      toast.error('Failed to create a new note.')
    }
  }

  const restoreDocument = async (id: string) => {
    try {
      toast.loading('Restoring note...')
      await documentApi.restore(id)
      invalidateDocumentQueries()
      toast.success('Note restored!')
    } catch {
      toast.error('Failed to restore note.')
    }
  }

  const removeDocument = async (id: string) => {
    try {
      toast.loading('Deleting note...')
      await documentApi.remove(id)
      invalidateTrashDocumentQueries()
      toast.success('Note deleted!')
    } catch {
      toast.error('Failed to delete note.')
    }

    if (params.documentId === id) {
      router.push('/documents')
    }
  }

  const updateDocument = async (doc: Doc) => {
    try {
      const newDocument = await documentApi.update(doc)
      setCurrentDocument(newDocument)
      invalidateDocumentQueries()
    } catch {
      toast.error('Failed to update note.')
    }
  }

  const removeDocumentIcon = async (id: string) => {
    try {
      const newDocument = await documentApi.removeIcon(id)
      setCurrentDocument(newDocument)
      invalidateDocumentQueries()
    } catch {
      toast.error('Failed to remove document icon.')
    }
  }

  const removeCoverImage = async (id: string) => {
    try {
      const newDocument = await documentApi.removeCoverImage(id)
      setCurrentDocument(newDocument)
    } catch {
      toast.error('Failed to remove cover image.')
    }
  }

  return {
    archiveDocument,
    createDocument,
    restoreDocument,
    removeDocument,
    updateDocument,
    removeDocumentIcon,
    removeCoverImage,
  }
}
