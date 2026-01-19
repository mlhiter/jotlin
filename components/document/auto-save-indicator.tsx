'use client'

import { AlertCircle } from 'lucide-react'

import { SaveStatus } from '@/hooks/use-auto-save'
import { cn } from '@/libs/utils/utils'

interface AutoSaveIndicatorProps {
  status: SaveStatus
  lastSavedAt: Date | null
  className?: string
}

export function AutoSaveIndicator({ status, lastSavedAt, className }: AutoSaveIndicatorProps) {
  const getTimeAgo = (date: Date | null) => {
    if (!date) return null

    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {status === 'error' && (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Failed to save</span>
        </>
      )}

      {status !== 'error' && lastSavedAt && (
        <span className="text-muted-foreground">Last saved {getTimeAgo(lastSavedAt)}</span>
      )}
    </div>
  )
}
