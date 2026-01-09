'use client'

import { formatDistanceToNow } from 'date-fns'
import { Clock, RotateCcw } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

import { useDocumentVersions } from '@/hooks/use-document-versions'
import { cn } from '@/libs/utils/utils'

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  currentVersion: number
}

export function VersionHistoryDialog({
  open,
  onOpenChange,
  documentId,
  currentVersion,
}: VersionHistoryDialogProps) {
  const { versions, isLoading, restoreVersion, isRestoring } = useDocumentVersions(documentId)
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)

  const handleRestore = async (versionNumber: number) => {
    setRestoringVersion(versionNumber)
    try {
      await restoreVersion(versionNumber)
      onOpenChange(false) // Close dialog after successful restore
    } finally {
      setRestoringVersion(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>View and restore previous versions of this document</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">No version history yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Versions will be created when AI modifies this document
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {versions.map((version) => {
                const isCurrentVersion = version.versionNumber === currentVersion
                const isRestoring = restoringVersion === version.versionNumber

                return (
                  <div
                    key={version.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-4 transition-colors',
                      isCurrentVersion ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Version {version.versionNumber}</span>
                          {isCurrentVersion && (
                            <Badge variant="outline" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(version.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {!isCurrentVersion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(version.versionNumber)}
                        disabled={isRestoring}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {isRestoring ? 'Restoring...' : 'Restore'}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
