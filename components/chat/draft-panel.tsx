'use client'

import {
  ChevronsLeft,
  ChevronsRight,
  Copy,
  FileText,
  Files,
  Search,
  FileCode,
  Workflow,
  Map,
  Layout,
  Maximize,
  Minimize,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { CompetitorView } from '@/components/chat/competitor-view'
import { DocumentRenderer } from '@/components/chat/document-renderer'
import { TextSelectionMenu } from '@/components/chat/text-selection-menu'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

type DocumentTabValue = 'REQUIREMENT' | 'PRODUCT_DOCUMENT' | 'FLOWCHART' | 'SITEMAP' | 'WIREFRAME'

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
    productDocument?: string
    flowchart?: string
    sitemap?: string
    wireframe?: string
  }
  readOnly?: boolean
  competitorRefreshTrigger?: number
  onScrollToMessage?: (messageId: string) => void
  isGeneratingDocuments?: boolean
  isFullscreen?: boolean
  onFullscreenChange?: (isFullscreen: boolean) => void
}

export function DraftPanel({
  isVisible = true,
  onToggle,
  onQuote,
  currentPhaseChatId,
  activeTab: externalActiveTab,
  onActiveTabChange,
  liveContent,
  readOnly = false,
  competitorRefreshTrigger = 0,
  isGeneratingDocuments = false,
  isFullscreen = false,
  onFullscreenChange,
}: DraftPanelProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<string | null>(null)
  const [activeDocumentTab, setActiveDocumentTab] = useState<DocumentTabValue>('REQUIREMENT')
  const [isNavCollapsed, setIsNavCollapsed] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const hasAnyLiveContent = !!(
    liveContent?.requirement?.draft ||
    liveContent?.requirement?.final ||
    liveContent?.productDocument ||
    liveContent?.flowchart ||
    liveContent?.sitemap ||
    liveContent?.wireframe
  )

  const hasAnyDocument = hasAnyLiveContent || isGeneratingDocuments
  const effectiveActiveTab = externalActiveTab ?? internalActiveTab ?? (hasAnyDocument ? 'documents' : 'documents')

  const setActiveTab = onActiveTabChange ?? setInternalActiveTab

  const getDocumentContent = (docType: DocumentTabValue): string | undefined => {
    switch (docType) {
      case 'REQUIREMENT':
        return liveContent?.requirement?.final || liveContent?.requirement?.draft
      case 'PRODUCT_DOCUMENT':
        return liveContent?.productDocument
      case 'FLOWCHART':
        return liveContent?.flowchart
      case 'SITEMAP':
        return liveContent?.sitemap
      case 'WIREFRAME':
        return liveContent?.wireframe
      default:
        return undefined
    }
  }

  const documentTabs = [
    {
      value: 'REQUIREMENT' as DocumentTabValue,
      label: 'Requirements',
      content: getDocumentContent('REQUIREMENT'),
      available: !!(liveContent?.requirement?.draft || liveContent?.requirement?.final),
      icon: FileText,
    },
    {
      value: 'PRODUCT_DOCUMENT' as DocumentTabValue,
      label: 'Product Doc',
      content: getDocumentContent('PRODUCT_DOCUMENT'),
      available: !!liveContent?.productDocument || isGeneratingDocuments,
      icon: FileCode,
    },
    {
      value: 'FLOWCHART' as DocumentTabValue,
      label: 'Flowchart',
      content: getDocumentContent('FLOWCHART'),
      available: !!liveContent?.flowchart || isGeneratingDocuments,
      icon: Workflow,
    },
    {
      value: 'SITEMAP' as DocumentTabValue,
      label: 'Sitemap',
      content: getDocumentContent('SITEMAP'),
      available: !!liveContent?.sitemap || isGeneratingDocuments,
      icon: Map,
    },
    {
      value: 'WIREFRAME' as DocumentTabValue,
      label: 'Wireframe',
      content: getDocumentContent('WIREFRAME'),
      available: !!liveContent?.wireframe || isGeneratingDocuments,
      icon: Layout,
    },
  ]

  const availableTabs = [
    { value: 'documents', label: 'Documents', available: hasAnyDocument, icon: FileText },
    {
      value: 'competitors',
      label: 'Competitors',
      available: !readOnly,
      icon: Search,
    },
  ].filter((t) => t.available)

  const availableDocumentTabs = documentTabs.filter((t) => t.available)

  useEffect(() => {
    if (availableDocumentTabs.length > 0 && !availableDocumentTabs.find((t) => t.value === activeDocumentTab)) {
      setActiveDocumentTab(availableDocumentTabs[0].value)
    }
  }, [availableDocumentTabs, activeDocumentTab])

  const handleFullscreenToggle = async () => {
    if (!panelRef.current || !onFullscreenChange) return

    try {
      if (!document.fullscreenElement) {
        await panelRef.current.requestFullscreen()
        onFullscreenChange(true)
      } else {
        await document.exitFullscreen()
        onFullscreenChange(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
      toast.error('Failed to toggle fullscreen')
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && onFullscreenChange) {
        onFullscreenChange(false)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [onFullscreenChange])

  if (availableTabs.length === 0) {
    return null
  }

  const handleCopy = async (type: 'current' | 'all') => {
    let content = ''

    if (type === 'current') {
      if (effectiveActiveTab === 'documents') {
        const currentDoc = documentTabs.find((t) => t.value === activeDocumentTab)
        content = currentDoc?.content || ''
      }
    } else {
      const allDocs = documentTabs
        .filter((doc) => doc.content)
        .map((doc) => `# ${doc.label}\n\n${doc.content}`)
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

  const panelWidth = 'w-[min(55vw,900px)]'

  return (
    <>
      <div
        ref={panelRef}
        className={`relative flex h-full shrink-0 transition-all duration-700 ease-in-out ${
          isVisible ? panelWidth : 'w-12 min-w-12'
        }`}>
        {onToggle && !isVisible && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggle()
            }}
            className="absolute left-2 top-4 z-50 h-8 w-8 transition-all duration-500 ease-in-out">
            <ChevronsLeft className="text-muted-foreground h-4 w-4" />
          </Button>
        )}

        <div
          className={`border-border bg-card m-2 flex h-[calc(100%-1rem)] w-full transform flex-col overflow-hidden rounded-lg border transition-all duration-700 ease-in-out ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}>
          <Tabs value={effectiveActiveTab} onValueChange={setActiveTab} className="flex h-full flex-col">
            <div className="border-border/40 flex items-center justify-between border-b px-4 py-2">
              <TabsList className="bg-muted/40 h-8 gap-1 rounded-md p-0.5">
                {availableTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:bg-background h-7 gap-1.5 rounded-sm px-2.5 text-xs font-medium data-[state=active]:shadow-sm">
                    <tab.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex items-center gap-1">
                {effectiveActiveTab === 'documents' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7" title="Copy document">
                        <Copy className="text-muted-foreground h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1" align="end">
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 justify-start gap-2 rounded-sm px-2 text-xs font-medium"
                          onClick={() => handleCopy('current')}>
                          <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                          Copy current
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 justify-start gap-2 rounded-sm px-2 text-xs font-medium"
                          onClick={() => handleCopy('all')}>
                          <Files className="h-3.5 w-3.5" strokeWidth={1.5} />
                          Copy all
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {onFullscreenChange && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleFullscreenToggle}
                    className="h-7 w-7"
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                    {isFullscreen ? (
                      <Minimize className="text-muted-foreground h-3.5 w-3.5" strokeWidth={1.5} />
                    ) : (
                      <Maximize className="text-muted-foreground h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                  </Button>
                )}
                {onToggle && isVisible && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onToggle()
                    }}
                    className="h-7 w-7"
                    title="Hide panel">
                    <ChevronsRight className="text-muted-foreground h-3.5 w-3.5" strokeWidth={1.5} />
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="documents" className="mt-0 flex h-full overflow-hidden">
              <div
                className={`border-border/40 relative flex shrink-0 flex-col border-r transition-all duration-300 ${
                  isNavCollapsed ? 'w-14' : 'w-48'
                }`}>
                <button
                  onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                  className="border-border/60 bg-background/95 hover:border-border hover:bg-accent absolute -right-2.5 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-md border shadow-sm backdrop-blur-sm transition-all hover:shadow">
                  <ChevronsLeft
                    className={`text-muted-foreground/70 h-3 w-3 transition-transform duration-300 ${
                      isNavCollapsed ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div className="flex-1 overflow-y-auto px-2 py-3">
                  {!isNavCollapsed && (
                    <div className="mb-1.5 px-2">
                      <div className="text-muted-foreground/60 text-[10px] font-medium uppercase tracking-wider">
                        Documents
                      </div>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {availableDocumentTabs.map((tab, index) => (
                      <button
                        key={tab.value}
                        onClick={() => setActiveDocumentTab(tab.value)}
                        style={{ animationDelay: `${index * 30}ms` }}
                        title={isNavCollapsed ? tab.label : undefined}
                        className={`group relative flex w-full items-center rounded-md transition-all duration-150 ${
                          isNavCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-2 py-2 text-left'
                        } ${
                          activeDocumentTab === tab.value
                            ? 'bg-accent/80 text-foreground'
                            : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                        }`}>
                        <div
                          className={`flex shrink-0 items-center justify-center transition-all duration-150 ${
                            isNavCollapsed ? 'h-5 w-5' : 'h-5 w-5'
                          } ${
                            activeDocumentTab === tab.value
                              ? 'text-foreground'
                              : 'text-muted-foreground/70 group-hover:text-foreground/90'
                          }`}>
                          <tab.icon className="h-4 w-4" strokeWidth={1.5} />
                        </div>
                        {!isNavCollapsed && (
                          <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
                            <span className="truncate text-[13px] font-medium">{tab.label}</span>
                            <div
                              className={`h-1 w-1 shrink-0 rounded-full transition-colors ${
                                tab.content
                                  ? 'bg-green-500/80'
                                  : isGeneratingDocuments && tab.value !== 'REQUIREMENT'
                                    ? 'animate-pulse bg-amber-400/80'
                                    : 'bg-muted-foreground/30'
                              }`}
                            />
                          </div>
                        )}
                        {activeDocumentTab === tab.value && !isNavCollapsed && (
                          <div className="bg-foreground absolute left-0 top-0 h-full w-0.5 rounded-r-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="border-border/40 flex items-center justify-between border-b px-5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {(() => {
                      const currentTab = availableDocumentTabs.find((t) => t.value === activeDocumentTab)
                      return (
                        <>
                          {currentTab && (
                            <>
                              <currentTab.icon className="text-muted-foreground/70 h-4 w-4" strokeWidth={1.5} />
                              <span className="text-foreground text-sm font-medium">{currentTab.label}</span>
                              {currentTab.content ? (
                                <div className="ml-1 flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5">
                                  <div className="h-1 w-1 rounded-full bg-green-500" />
                                  <span className="text-[10px] font-medium text-green-700 dark:text-green-400">
                                    Ready
                                  </span>
                                </div>
                              ) : isGeneratingDocuments && currentTab.value !== 'REQUIREMENT' ? (
                                <div className="ml-1 flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5">
                                  <div className="h-1 w-1 animate-pulse rounded-full bg-amber-500" />
                                  <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                    Generating
                                  </span>
                                </div>
                              ) : null}
                            </>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div className="bg-background relative flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div
                      className="animate-in fade-in slide-in-from-bottom-2 relative px-6 py-8 duration-300"
                      data-selection-container>
                      <DocumentRenderer
                        key={activeDocumentTab}
                        content={documentTabs.find((tab) => tab.value === activeDocumentTab)?.content || ''}
                        documentType={activeDocumentTab}
                      />
                      <TextSelectionMenu onQuote={onQuote} />
                    </div>
                  </ScrollArea>
                </div>
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
