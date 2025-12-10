'use client'

import { ChevronsLeft, ChevronsRight, Copy, FileText, Files, Search } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { CompetitorView } from '@/components/chat/competitor-view'
import { Markdown } from '@/components/chat/markdown'
import { TextSelectionMenu } from '@/components/chat/text-selection-menu'
import { VersionSelector } from '@/components/chat/version-selector'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import { useVersions } from '@/hooks/use-versions'

interface DraftPanelProps {
  isVisible?: boolean
  onToggle?: () => void
  onQuote?: (selectedText: string) => void
  chatId?: string
  currentPhaseChatId?: string
  activeTab?: string
  onActiveTabChange?: (tab: string) => void
  currentPhase?: 'REQUIREMENT' | null
  liveContent?: {
    requirement?: { draft?: string; final?: string }
  }
  readOnly?: boolean
  competitorRefreshTrigger?: number
  onScrollToMessage?: (messageId: string) => void
}

export function DraftPanel({
  isVisible = true,
  onToggle,
  onQuote,
  chatId,
  currentPhaseChatId,
  activeTab: externalActiveTab,
  onActiveTabChange,
  currentPhase,
  liveContent,
  readOnly = false,
  competitorRefreshTrigger = 0,
  onScrollToMessage,
}: DraftPanelProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<string | null>(null)
  const [activeDocumentTab, setActiveDocumentTab] = useState<'requirement'>('requirement')
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined)

  // Fetch versions for the current phase chat
  const { versions } = useVersions(currentPhaseChatId)

  // Track previous live content to detect rollback
  const prevLiveContentRef = useRef<string>('')

  // Reset selected version when phase chat changes
  useEffect(() => {
    setSelectedVersionId(undefined)
  }, [currentPhaseChatId])

  // Reset selected version when live content changes significantly (rollback case)
  useEffect(() => {
    if (!liveContent || !selectedVersionId) return

    const currentContent = [liveContent.requirement?.draft, liveContent.requirement?.final].filter(Boolean).join('')

    // If content changed and we're viewing a specific version, reset to live view
    if (prevLiveContentRef.current && currentContent !== prevLiveContentRef.current) {
      setSelectedVersionId(undefined)
    }

    prevLiveContentRef.current = currentContent
  }, [liveContent, selectedVersionId])

  // Check if any live content exists
  const hasAnyLiveContent = !!(liveContent?.requirement?.draft || liveContent?.requirement?.final)

  // Compute effective active tab - include live content in the check
  const hasAnyDocument = hasAnyLiveContent
  const effectiveActiveTab = externalActiveTab ?? internalActiveTab ?? (hasAnyDocument ? 'documents' : 'documents')

  const setActiveTab = onActiveTabChange ?? setInternalActiveTab

  // Determine which document content to show - from version or live content
  const getDocumentContent = (phase: 'requirement'): string | undefined => {
    // If viewing a specific version AND it matches the requested phase, return version content
    if (selectedVersionId) {
      const selectedVersion = versions.find((v) => v.id === selectedVersionId)
      if (selectedVersion && selectedVersion.phase === 'REQUIREMENT') {
        return selectedVersion.content
      }
      // If version doesn't match requested phase, fall through to live content
    }

    // Priority 1: Live final content for this phase
    if (liveContent?.requirement?.final) {
      return liveContent.requirement.final
    }

    // Priority 2: Live draft content for this phase
    if (liveContent?.requirement?.draft) {
      return liveContent.requirement.draft
    }

    return undefined
  }

  // Dynamic tab list based on available documents
  const documentTabs = [
    {
      value: 'requirement',
      label: 'Requirements',
      content: getDocumentContent('requirement'),
      available: !!(liveContent?.requirement?.draft || liveContent?.requirement?.final),
      icon: FileText,
    },
  ]

  // Outer level tabs (with Documents as a single tab)
  const availableTabs = [
    { value: 'documents', label: 'Documents', available: hasAnyDocument, icon: FileText },
    {
      value: 'competitors',
      label: 'Competitors',
      available: !readOnly && currentPhase === 'REQUIREMENT',
      icon: Search,
    },
  ].filter((t) => t.available)

  // Inner document tabs (for the nested tabs inside Documents)
  const availableDocumentTabs = documentTabs.filter((t) => t.available)

  // Compute effective document sub-tab based on current phase
  const effectiveDocumentTab = 'requirement'

  // Update activeDocumentTab when computed value changes
  useEffect(() => {
    if (effectiveDocumentTab !== activeDocumentTab) {
      setActiveDocumentTab(effectiveDocumentTab)
    }
  }, [effectiveDocumentTab])

  // If no tabs available, don't render
  if (availableTabs.length === 0) {
    return null
  }

  const handleCopy = async (type: 'current' | 'all') => {
    let content = ''

    if (type === 'current') {
      // When in documents tab, copy the active document sub-tab
      if (effectiveActiveTab === 'documents') {
        const currentDoc = documentTabs.find((t) => t.value === activeDocumentTab)
        content = currentDoc?.content || ''
      }
    } else {
      // Copy requirement document
      const allDocs = [
        getDocumentContent('requirement') && `# Requirements Analysis Document\n\n${getDocumentContent('requirement')}`,
      ]
        .filter(Boolean)
        .join('\n\n---\n\n')
      content = allDocs
    }

    if (content) {
      try {
        await navigator.clipboard.writeText(content)
        toast.success(type === 'current' ? 'Copied current document' : 'Copied document')
      } catch (err) {
        console.error('Failed to copy text: ', err)
        toast.error('Failed to copy text')
      }
    }
  }

  const panelWidth = 'w-[min(40vw,600px)]'

  return (
    <>
      <div
        className={`relative flex h-full shrink-0 transition-all duration-700 ease-in-out ${
          isVisible ? panelWidth : 'w-12 min-w-12'
        }`}>
        {onToggle && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggle}
            className={`top-4.5 absolute z-20 h-8 w-8 transition-all duration-500 ease-in-out ${
              isVisible ? 'right-4' : 'left-2'
            }`}>
            {isVisible ? (
              <ChevronsRight className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronsLeft className="text-muted-foreground h-4 w-4" />
            )}
          </Button>
        )}

        <div
          className={`border-border bg-card m-2 flex h-[calc(100%-1rem)] w-full transform flex-col overflow-hidden rounded-lg border transition-all duration-700 ease-in-out ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}>
          <Tabs value={effectiveActiveTab} onValueChange={setActiveTab} className="flex h-full flex-col">
            <div className="border-border flex items-center justify-between border-b px-4 py-2">
              <TabsList>
                {availableTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                    <tab.icon className="h-3 w-3" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mr-6 flex items-center gap-2">
                {effectiveActiveTab === 'documents' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Copy document">
                        <Copy className="text-muted-foreground h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="end">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start gap-2"
                          onClick={() => handleCopy('current')}>
                          <FileText className="h-4 w-4" />
                          Copy current document
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start gap-2"
                          onClick={() => handleCopy('all')}>
                          <Files className="h-4 w-4" />
                          Copy all documents
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {/* Fullscreen removed - single phase only */}
              </div>
            </div>

            <TabsContent value="documents" className="mt-0 flex h-full flex-col overflow-hidden">
              {/* Nested document tabs with version selector */}
              <div className="border-border flex items-center justify-between gap-1 border-b px-4">
                {availableDocumentTabs.length > 1 && (
                  <div className="flex items-center gap-1">
                    {availableDocumentTabs.map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setActiveDocumentTab(tab.value as 'requirement')}
                        className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                          activeDocumentTab === tab.value
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        {tab.label}
                        {activeDocumentTab === tab.value && (
                          <div className="bg-primary absolute bottom-0 left-0 right-0 h-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {currentPhaseChatId && (
                  <VersionSelector
                    chatId={currentPhaseChatId}
                    selectedVersionId={selectedVersionId}
                    onVersionSelect={setSelectedVersionId}
                    onScrollToMessage={onScrollToMessage}
                    className="my-1"
                  />
                )}
              </div>
              {/* Document content */}
              <div className="relative flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="relative p-4" data-selection-container>
                    <Markdown
                      key={`${activeDocumentTab}-${selectedVersionId || 'live'}-content`}
                      content={documentTabs.find((tab) => tab.value === activeDocumentTab)?.content || ''}
                    />
                    <TextSelectionMenu onQuote={onQuote} />
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="competitors" className="mt-0 flex-1 overflow-hidden">
              {currentPhaseChatId ? (
                <CompetitorView chatId={currentPhaseChatId} refreshTrigger={competitorRefreshTrigger} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground text-sm">No chat selected</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
