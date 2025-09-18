'use client'

import { ChevronsLeft, ChevronsRight, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Markdown } from '@/components/chat/markdown'
import { TextSelectionMenu } from '@/components/chat/text-selection-menu'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DraftPanelProps {
  draft?: string
  final?: string
  isVisible?: boolean
  onToggle?: () => void
  onQuote?: (selectedText: string) => void
}

export function DraftPanel({ draft, final, isVisible = true, onToggle, onQuote }: DraftPanelProps) {
  const content = final || draft
  const isDraft = !final && draft

  const handleCopy = async () => {
    if (content) {
      try {
        await navigator.clipboard.writeText(content)
        toast.success('Copied to clipboard')
      } catch (err) {
        console.error('Failed to copy text: ', err)
        toast.error('Failed to copy text')
      }
    }
  }

  return (
    <div className="relative h-full">
      {onToggle && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggle}
          className="absolute top-2 right-4 z-20 h-8 w-8 transition-all duration-500 ease-in-out">
          {isVisible ? (
            <ChevronsRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronsLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      )}

      {/* Panel content */}
      <div
        className={`m-2 flex h-[calc(100%-1rem)] w-[calc((100vw-260px)*(4/9))] transform flex-col rounded-lg border border-border bg-card transition-all duration-500 ease-in-out ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-card-foreground">{isDraft ? 'Draft' : 'Final'}</h4>
          </div>
          <Button size="icon" variant="ghost" onClick={handleCopy} className="mr-6 h-8 w-8" title="Copy all content">
            <Copy className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <ScrollArea className="h-0 flex-1">
          <div className="relative p-4" data-selection-container>
            <Markdown content={content || ''} />
            <TextSelectionMenu onQuote={onQuote} />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
