'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, FileIcon, Search } from 'lucide-react'
import { toast } from 'sonner'

import { chatApi } from '@/api/chat'
import { useDocumentStore } from '@/stores/document'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/libs/utils'

interface DocumentSelectorProps {
  chatId: string
  linkedDocumentIds: string[]
  onClose?: () => void
}

export const DocumentSelector = ({
  chatId,
  linkedDocumentIds,
  onClose,
}: DocumentSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()
  const { getDocuments } = useDocumentStore()

  const privateDocuments = getDocuments(null, 'private') || []
  const shareDocuments = getDocuments(null, 'share') || []
  const allDocuments = [...privateDocuments, ...shareDocuments]

  const filteredDocuments = allDocuments.filter((doc) =>
    doc?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const linkMutation = useMutation({
    mutationFn: (documentId: string) =>
      chatApi.linkDocument(chatId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
      toast.success('Document linked')
    },
    onError: () => {
      toast.error('Failed to link document')
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: (documentId: string) =>
      chatApi.unlinkDocument(chatId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
      toast.success('Document unlinked')
    },
    onError: () => {
      toast.error('Failed to unlink document')
    },
  })

  const handleToggleDocument = (documentId: string) => {
    const isLinked = linkedDocumentIds.includes(documentId)
    if (isLinked) {
      unlinkMutation.mutate(documentId)
    } else {
      linkMutation.mutate(documentId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <ScrollArea className="max-h-[300px]">
        <div className="space-y-1">
          {filteredDocuments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No documents found
            </p>
          ) : (
            filteredDocuments.map((doc) => {
              const isLinked = linkedDocumentIds.includes(doc.id)
              return (
                <div
                  key={doc.id}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent',
                    isLinked && 'bg-accent'
                  )}
                  onClick={() => handleToggleDocument(doc.id)}>
                  <div className="flex min-w-0 flex-1 items-center">
                    <FileIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{doc.title}</span>
                  </div>
                  {isLinked && <Check className="h-4 w-4 text-primary" />}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
