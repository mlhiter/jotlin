import { X, FileText, ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { formatFileSize, isImageFile } from '@/libs/utils/file-utils'

interface FilePreviewProps {
  file: File
  preview?: string | null
  onRemove: () => void
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  return (
    <div className="border-border relative flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
      <div className="bg-accent flex h-16 w-16 flex-shrink-0 items-center justify-center rounded">
        {isImageFile(file) ? (
          <ImageIcon className="text-accent-foreground h-8 w-8" />
        ) : (
          <FileText className="text-accent-foreground h-8 w-8" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
      </div>

      <Button type="button" size="sm" variant="ghost" onClick={onRemove} className="h-6 w-6 flex-shrink-0 p-0">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
