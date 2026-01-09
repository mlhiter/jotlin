'use client'

import { formatDistanceToNow } from 'date-fns'
import { Clock, RotateCcw, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

import { useDocumentVersions } from '@/hooks/use-document-versions'
import { cn } from '@/libs/utils/utils'

import { Markdown } from '../chat/markdown'

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  currentVersion: number
}

interface DocumentVersion {
  id: string
  documentId: string
  versionNumber: number
  content: string
  createdBy: string
  createdAt: string
}

export function VersionHistoryDialog({ open, onOpenChange, documentId, currentVersion }: VersionHistoryDialogProps) {
  const { versions, isLoading, restoreVersion, isRestoring } = useDocumentVersions(documentId)
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null)

  useEffect(() => {
    if (!isLoading && versions.length > 0 && !selectedVersion) {
      const current = versions.find((v) => v.versionNumber === currentVersion)
      setSelectedVersion(current || versions[0])
    }
  }, [versions, currentVersion, isLoading, selectedVersion])

  const handleRestore = async (versionNumber: number) => {
    setRestoringVersion(versionNumber)
    try {
      await restoreVersion(versionNumber)
      onOpenChange(false)
    } finally {
      setRestoringVersion(null)
    }
  }

  const handleVersionClick = (version: DocumentVersion) => {
    setSelectedVersion(version)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] w-[80vw] !max-w-[80vw] flex-col p-0">
        <DialogHeader className="border-border/40 shrink-0 border-b px-6 pb-3 pt-5">
          <DialogTitle className="text-base">Version History</DialogTitle>
          <DialogDescription className="text-muted-foreground/70 text-[13px]">
            View and restore previous versions of this document
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid flex-1 grid-cols-[2fr_1fr] gap-0">
            <div className="border-border/40 space-y-4 border-r px-6 py-6">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-48 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
            <div className="bg-muted/20 space-y-1 p-2">
              <div className="border-border/40 border-b px-4 py-2.5">
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <div className="space-y-0.5 p-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            </div>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="bg-muted/20 mb-4 flex h-16 w-16 items-center justify-center rounded-lg">
              <Clock className="text-muted-foreground/70 h-8 w-8" strokeWidth={1.5} />
            </div>
            <p className="text-foreground mb-1 font-medium">No version history yet</p>
            <p className="text-muted-foreground/70 text-[13px]">
              Versions will be created when AI modifies this document
            </p>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-[2fr_1fr] gap-0">
            {/* Left: Version Content */}
            <div className="border-border/40 flex min-h-0 flex-col border-r">
              {selectedVersion ? (
                <ScrollArea className="min-h-0 flex-1">
                  <div className="px-6 py-6">
                    <Markdown content={selectedVersion.content} />
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-muted-foreground/70 flex h-full items-center justify-center">
                  <p className="text-[13px]">Select a version to view its content</p>
                </div>
              )}
            </div>

            {/* Right: Version List */}
            <div className="bg-muted/20 flex min-h-0 flex-col">
              <div className="border-border/40 shrink-0 border-b px-4 py-2.5">
                <h4 className="text-[13px] font-medium">All Versions</h4>
              </div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-0.5 p-2">
                  {versions.map((version) => {
                    const isCurrentVersion = version.versionNumber === currentVersion
                    const isSelected = selectedVersion?.id === version.id
                    const isRestoringThis = isRestoring && restoringVersion === version.versionNumber

                    return (
                      <div
                        key={version.id}
                        className={cn(
                          'group relative rounded-md border transition-all duration-150',
                          isSelected
                            ? 'border-border/40 bg-background shadow-sm'
                            : 'bg-background/50 hover:border-border/40 hover:bg-background border-transparent'
                        )}>
                        <div
                          onClick={() => !isRestoringThis && handleVersionClick(version)}
                          className={cn(
                            'w-full cursor-pointer px-2.5 py-2 transition-opacity duration-150',
                            isRestoringThis && 'cursor-not-allowed opacity-50'
                          )}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="mb-0.5 flex items-center gap-1.5">
                                <span className="text-[13px] font-medium">v{version.versionNumber}</span>
                                {isCurrentVersion && (
                                  <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-medium">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground/70 truncate text-[11px]">
                                {formatDistanceToNow(new Date(version.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>

                            {/* Restore button - hover revealed, icon-only */}
                            {!isCurrentVersion && (
                              <div
                                className={cn(
                                  'transition-opacity duration-150',
                                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                )}>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRestore(version.versionNumber)
                                  }}
                                  disabled={isRestoringThis}
                                  title={isRestoringThis ? 'Restoring...' : 'Restore this version'}>
                                  {isRestoringThis ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                                  ) : (
                                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
