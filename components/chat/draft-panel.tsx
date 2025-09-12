'use client'

import { ChevronsLeft, ChevronsRight } from 'lucide-react'

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

  if (!content) return null

  return (
    <div className="relative h-full">
      {onToggle && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggle}
          className="absolute top-2 z-20 h-6 w-6 transition-all duration-500 ease-in-out right-4">
          {isVisible ? (
            <ChevronsRight className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronsLeft className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>
      )}

      {/* Panel content */}
      <div
        className={`w-[calc((100vw-260px)*(4/9))] border border-border bg-card flex flex-col rounded-lg m-2
          h-[calc(100%-1rem)] transition-all duration-500 ease-in-out transform ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}>
        <div className="flex items-center justify-between py-2 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-card-foreground">{isDraft ? 'Draft' : 'Final'}</h4>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0">
          <div className="p-4 relative" data-selection-container>
            <div className="max-w-none text-sm">
              <Markdown content={content} />
            </div>
            <TextSelectionMenu onQuote={onQuote} />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
