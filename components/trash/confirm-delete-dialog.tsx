'use client'

import { AlertTriangle } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  type: 'project' | 'document'
  isDeleting: boolean
  childrenCount?: {
    documents?: number
    chatThreads?: number
  }
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  type,
  isDeleting,
  childrenCount,
}: ConfirmDeleteDialogProps) {
  const hasChildren = childrenCount && (childrenCount.documents || childrenCount.chatThreads)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <AlertDialogTitle>
              Permanently Delete {type === 'project' ? 'Project' : 'Document'}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to permanently delete <strong>&quot;{title}&quot;</strong>?
            </p>
            <p className="text-destructive font-medium">This action cannot be undone.</p>
            {hasChildren && (
              <p>
                This will also permanently delete:
                {childrenCount.documents && childrenCount.documents > 0 && (
                  <span className="block ml-4">• {childrenCount.documents} document(s)</span>
                )}
                {childrenCount.chatThreads && childrenCount.chatThreads > 0 && (
                  <span className="block ml-4">• {childrenCount.chatThreads} chat thread(s)</span>
                )}
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Forever'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
