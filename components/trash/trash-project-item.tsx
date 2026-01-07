'use client'

import { formatDistanceToNow } from 'date-fns'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { usePermanentDeleteProject } from '@/hooks/use-permanent-delete-project'
import { useRestoreProject } from '@/hooks/use-restore-project'

import { ConfirmDeleteDialog } from './confirm-delete-dialog'

interface TrashProjectItemProps {
  project: {
    id: string
    title: string
    icon: string | null
    deletedAt: Date | string
    _count: {
      documents: number
      chatThreads: number
    }
  }
  workspaceId: string
}

export function TrashProjectItem({ project, workspaceId }: TrashProjectItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { mutateAsync: restoreProject, isPending: isRestoring } = useRestoreProject(workspaceId)
  const { mutateAsync: deleteProject, isPending: isDeleting } = usePermanentDeleteProject(workspaceId)

  const handleRestore = async () => {
    await restoreProject(project.id)
  }

  const handlePermanentDelete = async () => {
    await deleteProject(project.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon + Info */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="text-2xl">{project.icon || '📁'}</div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium">{project.title}</h3>
              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span>Deleted {formatDistanceToNow(new Date(project.deletedAt), { addSuffix: true })}</span>
                {project._count.documents > 0 && <span>{project._count.documents} documents</span>}
                {project._count.chatThreads > 0 && <span>{project._count.chatThreads} chats</span>}
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
        title={project.title}
        type="project"
        isDeleting={isDeleting}
        childrenCount={{
          documents: project._count.documents,
          chatThreads: project._count.chatThreads,
        }}
      />
    </>
  )
}
