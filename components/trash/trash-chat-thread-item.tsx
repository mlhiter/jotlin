'use client'

import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { usePermanentDeleteChatThread } from '@/hooks/use-permanent-delete-chat-thread'
import { useRestoreChatThread } from '@/hooks/use-restore-chat-thread'

import { ConfirmDeleteDialog } from './confirm-delete-dialog'

interface TrashChatThreadItemProps {
  chatThread: {
    id: string
    title: string | null
    type: string
    deletedAt: Date | string
    project?: {
      id: string
      title: string
      icon: string | null
    } | null
    document?: {
      id: string
      title: string
      icon: string | null
      documentType: string
    } | null
    _count: {
      messages: number
    }
  }
  workspaceId: string
}

export function TrashChatThreadItem({ chatThread, workspaceId }: TrashChatThreadItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { mutateAsync: restoreChatThread, isPending: isRestoring } = useRestoreChatThread(workspaceId)
  const { mutateAsync: deleteChatThread, isPending: isDeleting } = usePermanentDeleteChatThread(workspaceId)

  const handleRestore = async () => {
    await restoreChatThread(chatThread.id)
  }

  const handlePermanentDelete = async () => {
    await deleteChatThread(chatThread.id)
    setShowDeleteDialog(false)
  }

  // Determine parent context
  const parentContext = chatThread.project
    ? `${chatThread.project.icon || '📁'} ${chatThread.project.title}`
    : chatThread.document
      ? `${chatThread.document.icon || '📄'} ${chatThread.document.title}`
      : 'Unknown'

  const chatType = chatThread.type === 'PROJECT' ? 'Project Chat' : 'Document Chat'

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon + Info */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium">{chatThread.title || 'Untitled Chat'}</h3>
                <Badge variant="outline" className="text-xs">
                  {chatType}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Deleted {formatDistanceToNow(new Date(chatThread.deletedAt), { addSuffix: true })}</span>
                <span>{parentContext}</span>
                {chatThread._count.messages > 0 && <span>{chatThread._count.messages} messages</span>}
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
        title={chatThread.title || 'Untitled Chat'}
        type="document"
        isDeleting={isDeleting}
        childrenCount={{
          chatThreads: chatThread._count.messages,
        }}
      />
    </>
  )
}
