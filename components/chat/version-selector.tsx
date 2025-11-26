'use client'

import { useState } from 'react'
import { History, Check, ChevronDown } from 'lucide-react'

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
import { toast } from 'sonner'

interface VersionSelectorProps {
  chatId: string
  selectedVersionId?: string
  onVersionSelect: (versionId: string | undefined) => void
  onScrollToMessage?: (messageId: string) => void
  className?: string
}

export function VersionSelector({
  chatId,
  selectedVersionId,
  onVersionSelect,
  onScrollToMessage,
  className,
}: VersionSelectorProps) {
  const { versions, isLoading } = useVersions(chatId)
  const [openDropdown, setOpenDropdown] = useState(false)

  const currentVersion = versions.find((v) => v.id === selectedVersionId)
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
  if (versions.length === 0) {
    return (
      <Button variant="ghost" size="sm" className={className} disabled title="No version history. Versions will be created automatically after AI generates content.">
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="ml-1 text-muted-foreground">No versions</span>
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
        {versions.map((version, index) => {
          const isSelected = version.id === selectedVersionId
          const isCurrent = index === 0

          return (
            <div key={version.id} className="relative">
              <DropdownMenuItem
                className="flex flex-col items-start py-3 cursor-pointer"
                onSelect={() => handleVersionClick(version.id)}
              >
                <div className="flex items-center gap-2 w-full mb-1">
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  <span className="font-medium truncate flex-1">{version.title}</span>
                  {isCurrent && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded shrink-0">Current</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span>{version.type === 'final' ? 'Final' : 'Draft'}</span>
                </div>
                {version.preview && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{version.preview}</p>
                )}
              </DropdownMenuItem>
            </div>
          )
        })}
        {versions.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">No version history</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
