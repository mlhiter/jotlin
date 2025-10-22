'use client'

import { Loader2 } from 'lucide-react'

import { Card } from '@/components/ui/card'

interface SimpleProgressProps {
  message: string
  fileCount: number
}

export function SimpleProgress({ message, fileCount }: SimpleProgressProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Loader2 className="mt-1 h-5 w-5 shrink-0 animate-spin text-primary" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">{message}</p>
          {fileCount > 0 && <p className="text-xs text-muted-foreground">{fileCount} files created</p>}
        </div>
      </div>
    </Card>
  )
}
