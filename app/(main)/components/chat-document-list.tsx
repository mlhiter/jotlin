'use client'

import { toast } from 'sonner'
import { FileIcon, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { cn } from '@/libs/utils'
import { Doc } from '@/types/document'
import { chatApi } from '@/api/chat'
import { Button } from '@/components/ui/button'

interface ChatDocumentListProps {
  chatId: string
  documents: Doc[]
  editable?: boolean
}

export const ChatDocumentList = ({
  chatId,
  documents,
  editable = false,
}: ChatDocumentListProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()

  const unlinkMutation = useMutation({
    mutationFn: (documentId: string) =>
      chatApi.unlinkDocument(chatId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
      toast.success('Document removed')
    },
    onError: () => {
      toast.error('Failed to remove document')
    },
  })

  const handleDocumentClick = (documentId: string) => {
    router.push(`/documents/${documentId}`)
  }

  const handleUnlink = (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation()
    unlinkMutation.mutate(documentId)
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No linked documents
      </div>
    )
  }

  return (
    <div className="space-y-1 p-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className={cn(
            'group flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent'
          )}
          onClick={() => handleDocumentClick(doc.id)}>
          <div className="flex min-w-0 flex-1 items-center">
            <FileIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{doc.title}</span>
          </div>

          {editable && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => handleUnlink(e, doc.id)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
