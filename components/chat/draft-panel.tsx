'use client'

import {
  ChevronsLeft,
  ChevronsRight,
  Copy,
  FileText,
  Eye,
  Code,
  Maximize2,
  Minimize2,
  Files,
  Search,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { CompetitorView } from '@/components/chat/competitor-view'
import { Markdown } from '@/components/chat/markdown'
import { TextSelectionMenu } from '@/components/chat/text-selection-menu'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import apiClient from '@/libs/utils/axios'

// NOTE: turbopack will cause dev refresh error,so I do not use turbopack to solve this problem
const PreviewLoader = () => {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading preview...</div>
    </div>
  )
}

const Preview = dynamic(() => import('@/components/mvp/preview').then((mod) => ({ default: mod.Preview })), {
  ssr: false,
  loading: PreviewLoader,
})

const CodeViewerLoader = () => {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading code viewer...</div>
    </div>
  )
}

const CodeViewer = dynamic(() => import('@/components/mvp/code-viewer').then((mod) => ({ default: mod.CodeViewer })), {
  ssr: false,
  loading: CodeViewerLoader,
})

interface DraftPanelProps {
  isVisible?: boolean
  onToggle?: () => void
  onQuote?: (selectedText: string) => void
  chatId?: string
  currentPhaseChatId?: string
  activeTab?: string
  onActiveTabChange?: (tab: string) => void
  currentPhase?: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT' | null
  liveContent?: {
    requirement?: { draft?: string; final?: string }
    architecture?: { draft?: string; final?: string }
    development?: { draft?: string; final?: string }
  }
  readOnly?: boolean
  mvpCodeGenerationTrigger?: number
  competitorRefreshTrigger?: number
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
  mvpCodeGenerationTrigger = 0,
  competitorRefreshTrigger = 0,
}: DraftPanelProps) {
  const [mvpData, setMvpData] = useState<{
    files: Record<string, string>
  } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [internalActiveTab, setInternalActiveTab] = useState<string | null>(null)
  const [activeDocumentTab, setActiveDocumentTab] = useState<'requirement' | 'architecture' | 'development'>(
    'requirement'
  )
  const [hasMvpCode, setHasMvpCode] = useState(false)
  const [isCheckingMvp, setIsCheckingMvp] = useState(true)

  // Debug log for competitor refresh trigger
  useEffect(() => {
    console.log('[DraftPanel] competitorRefreshTrigger changed:', competitorRefreshTrigger)
  }, [competitorRefreshTrigger])

  // Check if any live content exists
  const hasAnyLiveContent = !!(
    liveContent?.requirement?.draft ||
    liveContent?.requirement?.final ||
    liveContent?.architecture?.draft ||
    liveContent?.architecture?.final ||
    liveContent?.development?.draft ||
    liveContent?.development?.final
  )

  // Compute effective active tab - include live content in the check
  const hasAnyDocument = hasAnyLiveContent
  const effectiveActiveTab =
    externalActiveTab ?? internalActiveTab ?? (hasAnyDocument ? 'documents' : mvpData ? 'preview' : 'documents')

  const setActiveTab = onActiveTabChange ?? setInternalActiveTab

  // Determine which document content to show - directly from live content
  const getDocumentContent = (phase: 'requirement' | 'architecture' | 'development'): string | undefined => {
    // Priority 1: Live final content for this phase
    if (liveContent?.[phase]?.final) {
      return liveContent[phase].final
    }

    // Priority 2: Live draft content for this phase (preview only)
    if (liveContent?.[phase]?.draft) {
      return liveContent[phase].draft
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
    {
      value: 'architecture',
      label: 'Architecture',
      content: getDocumentContent('architecture'),
      available: !!(liveContent?.architecture?.draft || liveContent?.architecture?.final),
      icon: FileText,
    },
    {
      value: 'development',
      label: 'Development',
      content: getDocumentContent('development'),
      available: !!(liveContent?.development?.draft || liveContent?.development?.final),
      icon: FileText,
    },
  ]

  // Outer level tabs (with Documents as a single tab)
  const hasDevelopmentContent = !!(liveContent?.development?.draft || liveContent?.development?.final)

  // Preview and Code tabs should show if:
  // 1. We have confirmed MVP code exists (hasMvpCode), OR
  // 2. We have development content (meaning we can potentially generate code)
  const shouldShowCodeTabs = !readOnly && (hasMvpCode || hasDevelopmentContent)

  const availableTabs = [
    { value: 'documents', label: 'Documents', available: hasAnyDocument, icon: FileText },
    {
      value: 'competitors',
      label: 'Competitors',
      available: !readOnly && currentPhase === 'REQUIREMENT',
      icon: Search,
    },
    { value: 'preview', label: 'Preview', available: shouldShowCodeTabs, icon: Eye },
    { value: 'code', label: 'Code', available: shouldShowCodeTabs, icon: Code },
  ].filter((t) => t.available)

  // Inner document tabs (for the nested tabs inside Documents)
  const availableDocumentTabs = documentTabs.filter((t) => t.available)

  // Compute effective document sub-tab based on current phase
  const effectiveDocumentTab = (() => {
    // Priority 1: Current phase with content
    if (currentPhase === 'DEVELOPMENT' && hasDevelopmentContent) return 'development'
    if (currentPhase === 'ARCHITECTURE' && (liveContent?.architecture?.draft || liveContent?.architecture?.final))
      return 'architecture'
    if (currentPhase === 'REQUIREMENT' && (liveContent?.requirement?.draft || liveContent?.requirement?.final))
      return 'requirement'

    // Priority 2: Any available content (reverse order to show latest)
    if (hasDevelopmentContent) return 'development'
    if (liveContent?.architecture?.draft || liveContent?.architecture?.final) return 'architecture'
    if (liveContent?.requirement?.draft || liveContent?.requirement?.final) return 'requirement'

    // Default to requirement
    return 'requirement'
  })()

  // Update activeDocumentTab when computed value changes
  useEffect(() => {
    if (effectiveDocumentTab !== activeDocumentTab) {
      setActiveDocumentTab(effectiveDocumentTab)
    }
  }, [effectiveDocumentTab])

  // Check if MVP code exists on mount, when chatId changes, or when code is generated
  useEffect(() => {
    if (!chatId) {
      setIsCheckingMvp(false)
      setHasMvpCode(false)
      return
    }

    setIsCheckingMvp(true)

    apiClient
      .get(`/api/mvp/${chatId}`)
      .then((res) => {
        const hasCode = !!(res.data && res.data.files && Object.keys(res.data.files).length > 0)
        setHasMvpCode(hasCode)
        setIsCheckingMvp(false)
      })
      .catch(() => {
        setHasMvpCode(false)
        setIsCheckingMvp(false)
      })
  }, [chatId, mvpCodeGenerationTrigger])

  // Fetch MVP data only when user switches to preview or code tab
  useEffect(() => {
    if (chatId && shouldShowCodeTabs && (effectiveActiveTab === 'preview' || effectiveActiveTab === 'code')) {
      apiClient
        .get(`/api/mvp/${chatId}`)
        .then((res) => {
          if (res.data && res.data.files) {
            const hasCode = Object.keys(res.data.files).length > 0
            setMvpData({
              files: res.data.files,
            })
            // Update hasMvpCode if we successfully loaded code
            if (hasCode && !hasMvpCode) {
              setHasMvpCode(true)
            }
          }
        })
        .catch(() => {
          // Failed to fetch MVP data
        })
    }
  }, [chatId, shouldShowCodeTabs, effectiveActiveTab, hasMvpCode])

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
      // Copy all three documents from live content
      const allDocs = [
        getDocumentContent('requirement') && `# Requirements Analysis Document\n\n${getDocumentContent('requirement')}`,
        getDocumentContent('architecture') &&
          `# Technical Architecture Document\n\n${getDocumentContent('architecture')}`,
        getDocumentContent('development') && `# Development Plan Document\n\n${getDocumentContent('development')}`,
      ]
        .filter(Boolean)
        .join('\n\n---\n\n')
      content = allDocs
    }

    if (content) {
      try {
        await navigator.clipboard.writeText(content)
        toast.success(type === 'current' ? 'Copied current document' : 'Copied all documents')
      } catch (err) {
        console.error('Failed to copy text: ', err)
        toast.error('Failed to copy text')
      }
    }
  }

  const panelWidth = effectiveActiveTab === 'documents' ? 'w-[min(40vw,600px)]' : 'w-[min(65vw,1200px)]'

  const canFullscreen = effectiveActiveTab === 'preview' || effectiveActiveTab === 'code'

  if (isFullscreen) {
    return (
      <div className="bg-background fixed inset-0 z-50 flex flex-col">
        <Tabs value={effectiveActiveTab} onValueChange={setActiveTab} className="flex h-full flex-col">
          <div className="border-border bg-card flex items-center justify-between border-b px-4 py-2">
            <TabsList>
              {availableTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex items-center gap-2">
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
              {canFullscreen && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsFullscreen(false)}
                  className="h-8 w-8"
                  title="Exit fullscreen">
                  <Minimize2 className="text-muted-foreground h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="documents" className="mt-0 flex h-full flex-col overflow-hidden">
            {/* Nested document tabs */}
            {availableDocumentTabs.length > 1 && (
              <div className="border-border flex items-center gap-1 border-b px-4">
                {availableDocumentTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveDocumentTab(tab.value as 'requirement' | 'architecture' | 'development')}
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
            {/* Document content */}
            <div className="relative flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="relative p-4" data-selection-container>
                  <Markdown content={documentTabs.find((tab) => tab.value === activeDocumentTab)?.content || ''} />
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

          <TabsContent value="preview" className="mt-0 flex-1 overflow-hidden">
            {mvpData ? (
              <Preview files={mvpData.files} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">No preview available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="code" className="mt-0 flex-1 overflow-hidden">
            {mvpData ? (
              <CodeViewer files={mvpData.files} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">No code available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    )
  }

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
                {canFullscreen && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsFullscreen(true)}
                    className="h-8 w-8"
                    title="Fullscreen">
                    <Maximize2 className="text-muted-foreground h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="documents" className="mt-0 flex h-full flex-col overflow-hidden">
              {/* Nested document tabs */}
              {availableDocumentTabs.length > 1 && (
                <div className="border-border flex items-center gap-1 border-b px-4">
                  {availableDocumentTabs.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setActiveDocumentTab(tab.value as 'requirement' | 'architecture' | 'development')}
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
              {/* Document content */}
              <div className="relative flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="relative p-4" data-selection-container>
                    <Markdown content={documentTabs.find((tab) => tab.value === activeDocumentTab)?.content || ''} />
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

            <TabsContent
              value="preview"
              className="mt-0 flex-1 overflow-hidden"
              forceMount
              hidden={effectiveActiveTab !== 'preview'}>
              {mvpData ? (
                <Preview files={mvpData.files} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground text-sm">No preview available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="code"
              className="mt-0 flex-1 overflow-hidden"
              forceMount
              hidden={effectiveActiveTab !== 'code'}>
              {mvpData ? (
                <CodeViewer files={mvpData.files} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground text-sm">No code available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
