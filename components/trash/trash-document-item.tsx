'use client'

import { formatDistanceToNow } from 'date-fns'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { usePermanentDeleteDocument } from '@/hooks/use-permanent-delete-document'
import { useRestoreDocument } from '@/hooks/use-restore-document'

import { ConfirmDeleteDialog } from './confirm-delete-dialog'

interface TrashDocumentItemProps {
  document: {
    id: string
    title: string
    icon: string | null
    documentType: string
    deletedAt: Date | string
    project?: {
      id: string
      title: string
      icon: string | null
    } | null
    _count: {
      chatThreads: number
    }
  }
  workspaceId: string
}

export function TrashDocumentItem({ document, workspaceId }: TrashDocumentItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { mutateAsync: restoreDocument, isPending: isRestoring } = useRestoreDocument(workspaceId)
  const { mutateAsync: deleteDocument, isPending: isDeleting } = usePermanentDeleteDocument(workspaceId)

  const handleRestore = async () => {
    await restoreDocument(document.id)
  }

  const handlePermanentDelete = async () => {
    await deleteDocument(document.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon + Info */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="text-2xl">{document.icon || '📄'}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium">{document.title}</h3>
                {document.documentType && document.documentType !== 'Custom' && (
                  <Badge variant="secondary" className="text-xs">
                    {document.documentType}
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span>Deleted {formatDistanceToNow(new Date(document.deletedAt), { addSuffix: true })}</span>
                {document.project && (
                  <span>
                    {document.project.icon} {document.project.title}
                  </span>
                )}
                {document._count.chatThreads > 0 && <span>{document._count.chatThreads} chats</span>}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRestore} disabled={isRestoring || isDeleting}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isRestoring || isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Forever
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handlePermanentDelete}
        title={document.title}
        type="document"
        isDeleting={isDeleting}
        childrenCount={{
          chatThreads: document._count.chatThreads,
        }}
      />
    </>
  )
}
