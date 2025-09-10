'use client'

import { X } from 'lucide-react'

import { Markdown } from '@/components/chat/markdown'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface RequirementSidebarProps {
  draft?: string
  final?: string
  onClose: () => void
}

export function RequirementSidebar({ draft, final, onClose }: RequirementSidebarProps) {
  const content = final || draft
  const isDraft = !final && draft

  if (!content) return null

  return (
    <div className="w-4/9 border border-border bg-white flex flex-col rounded-lg mb-2 mr-2">
      <div className="flex items-center justify-between py-2 px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{isDraft ? 'Draft' : 'Final'}</h4>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 h-0">
        <div className="p-4">
          <div className="max-w-none text-sm">
            <Markdown content={content} />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
