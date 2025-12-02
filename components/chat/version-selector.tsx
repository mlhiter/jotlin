'use client'

import { History, Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useVersions, Version } from '@/hooks/use-versions'
import { DocumentType } from '@/schema/chat'

interface VersionSelectorProps {
  chatId: string
  selectedVersionId?: string
  onVersionSelect: (versionId: string | undefined) => void
  onScrollToMessage?: (messageId: string) => void
  documentType?: DocumentType
  className?: string
}

export function VersionSelector({
  chatId,
  selectedVersionId,
  onVersionSelect,
  onScrollToMessage,
  documentType,
  className,
}: VersionSelectorProps) {
  const { versions, isLoading } = useVersions(chatId)
  const [openDropdown, setOpenDropdown] = useState(false)

  // Filter versions by document type if provided
  const filteredVersions = documentType ? versions.filter((v) => v.metadata?.documentType === documentType) : versions

  const currentVersion = filteredVersions.find((v) => v.id === selectedVersionId)
  const isViewingHistory = !!selectedVersionId && selectedVersionId !== versions[0]?.id

  const handleVersionClick = (versionId: string) => {
    onVersionSelect(versionId)
    if (onScrollToMessage) {
      onScrollToMessage(versionId)
    }
    setOpenDropdown(false)
  }

  // Show loading state
  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" className={className} disabled>
        <History className="h-4 w-4" />
        <span className="ml-1">Loading...</span>
      </Button>
    )
  }

  // Show disabled button when no versions exist
  if (filteredVersions.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={className}
        disabled
        title="No version history. Versions will be created automatically after AI generates content.">
        <History className="text-muted-foreground h-4 w-4" />
        <span className="text-muted-foreground ml-1">No versions</span>
      </Button>
    )
  }

  return (
    <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <History className="h-4 w-4" />
          <span className="ml-1">
            {currentVersion?.title || 'Current Version'} {isViewingHistory && '(History)'}
          </span>
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[320px]">
        <DropdownMenuLabel>Version History</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filteredVersions.map((version, index) => {
          const isSelected = version.id === selectedVersionId
          const isCurrent = index === 0

          return (
            <div key={version.id} className="relative">
              <DropdownMenuItem
                className="flex cursor-pointer flex-col items-start py-3"
                onSelect={() => handleVersionClick(version.id)}>
                <div className="mb-1 flex w-full items-center gap-2">
                  {isSelected && <Check className="text-primary h-4 w-4 shrink-0" />}
                  <span className="flex-1 truncate font-medium">{version.title}</span>
                  {isCurrent && (
                    <span className="bg-primary/10 text-primary shrink-0 rounded px-2 py-0.5 text-xs">Current</span>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  <span>{version.type === 'final' ? 'Final' : 'Draft'}</span>
                </div>
                {version.preview && (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{version.preview}</p>
                )}
              </DropdownMenuItem>
            </div>
          )
        })}
        {filteredVersions.length === 0 && (
          <div className="text-muted-foreground py-6 text-center text-sm">No version history</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
