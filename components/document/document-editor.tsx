'use client'

import { useEffect, useState } from 'react'
import { useAutoSave } from '@/hooks/use-auto-save'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/libs/utils/utils'

interface DocumentEditorProps {
  documentId: string
  initialContent: string
  onSave?: (content: string) => Promise<void>
  className?: string
}

export function DocumentEditor({
  documentId,
  initialContent,
  onSave,
  className,
}: DocumentEditorProps) {
  const [content, setContent] = useState(initialContent)
  const { status, lastSavedAt, saveNow } = useAutoSave({
    documentId,
    content,
    delay: 1000,
    onSave,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveNow()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [saveNow])

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your document in Markdown..."
        className="min-h-full resize-none border-0 p-6 font-mono text-sm focus-visible:ring-0"
      />

      <div className="border-t px-6 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{content.length} characters</span>
          <span>
            {content.split(/\s+/).filter(Boolean).length} words · {content.split('\n').length}{' '}
            lines
          </span>
        </div>
      </div>
    </div>
  )
}
