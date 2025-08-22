'use client'

import { useQuery } from '@tanstack/react-query'
import { Search, Trash, Undo } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import ConfirmModal from '@/components/modals/confirm-modal'
import { Spinner } from '@/components/spinner'
import { Input } from '@/components/ui/input'

import { documentApi } from '@/api/document'
import { useDocumentActions } from '@/hooks/use-document-actions'

const TrashBox = () => {
  const router = useRouter()
  const { restoreDocument, removeDocument } = useDocumentActions()

  const { data: documents } = useQuery({
    queryKey: ['trash-documents'],
    queryFn: () => documentApi.getTrashDocuments(),
  })

  const [search, setSearch] = useState('')
  const filteredDocuments = documents?.filter((document) => {
    return document?.title?.toLowerCase().includes(search.toLowerCase())
  })

  const onClick = (documentId: string) => {
    router.push(`/documents/${documentId}`)
  }

  const onRestore = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>, documentId: string) => {
    event.stopPropagation()
    await restoreDocument(documentId)
  }

  const onRemove = async (documentId: string) => {
    await removeDocument(documentId)
  }

  if (documents === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    )
  }
  return (
    <div className="text-sm">
      <div className="flex items-center gap-x-1 p-2">
        <Search className="h-4 w-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 bg-secondary px-2 focus-visible:ring-transparent"
          placeholder="Filter by page title..."
        />
      </div>
      <div className="mt-2 px-1 pb-1">
        <p className="hidden pb-2 text-center text-xs text-muted-foreground last:block">No documents found.</p>
        {filteredDocuments?.map((document) => (
          <div
            key={document.id}
            role="button"
            onClick={() => onClick(document.id)}
            className="flex w-full items-center justify-between rounded-sm text-sm text-primary hover:bg-primary/5">
            <span className="truncate pl-2">{document.title}</span>
            <div className="flex items-center">
              <div
                className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-300"
                role="button"
                onClick={(e) => onRestore(e, document.id)}>
                <Undo className="h-4 w-4 text-muted-foreground" />
              </div>
              <ConfirmModal onConfirm={() => onRemove(document.id)}>
                <div role="button" className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-300">
                  <Trash className="h-4 w-4 text-muted-foreground" />
                </div>
              </ConfirmModal>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TrashBox
