'use client'

import { ChevronsLeft, ChevronsRight, Copy, FileText, Eye, Code, Maximize2, Minimize2, Files } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

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
  documents: {
    requirement?: { content: string; status: string }
    architecture?: { content: string; status: string }
    development?: { content: string; status: string }
  }
  isVisible?: boolean
  onToggle?: () => void
  onQuote?: (selectedText: string) => void
  chatId?: string
  activeTab?: string
  onActiveTabChange?: (tab: string) => void
  currentPhase?: 'DISCOVERY' | 'FEATURE_BENCHMARK' | 'MARKET_POSITIONING' | null
  liveDraft?: string
  liveFinal?: string
  readOnly?: boolean
}

export function DraftPanel({
  documents,
  isVisible = true,
  onToggle,
  onQuote,
  chatId,
  activeTab: externalActiveTab,
  onActiveTabChange,
  currentPhase,
  liveDraft,
  liveFinal,
  readOnly = false,
}: DraftPanelProps) {
  const [mvpData, setMvpData] = useState<{
    files: Record<string, string>
  } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [internalActiveTab, setInternalActiveTab] = useState<string | null>(null)
  const [activeDocumentTab, setActiveDocumentTab] = useState<'requirement' | 'architecture' | 'development'>(
    'requirement'
  )

  // Compute live content: if liveFinal exists, use it; otherwise use liveDraft
  const liveContent = liveFinal || liveDraft

  // Compute effective active tab - include live content in the check
  const hasAnyDocument = !!(documents.requirement || documents.architecture || documents.development || liveContent)
  const effectiveActiveTab =
    externalActiveTab ?? internalActiveTab ?? (hasAnyDocument ? 'documents' : mvpData ? 'preview' : 'documents')

  const setActiveTab = onActiveTabChange ?? setInternalActiveTab

  // Determine which document content to show based on current phase and live content
  const getDocumentContent = (
    phase: 'requirement' | 'architecture' | 'development',
    savedContent?: string
  ): string | undefined => {
    const phaseMap = {
      requirement: 'DISCOVERY',
      architecture: 'FEATURE_BENCHMARK',
      development: 'MARKET_POSITIONING',
    }

    // Priority 1: Saved final document (most reliable)
    if (savedContent) {
      return savedContent
    }

    // Priority 2: Current phase with live final content
    if (currentPhase === phaseMap[phase] && liveFinal) {
      return liveFinal
    }

    // Priority 3: Current phase with live draft (preview only)
    if (currentPhase === phaseMap[phase] && liveDraft) {
      return liveDraft
    }

    return undefined
  }

  // Dynamic tab list based on available documents
  const documentTabs = [
    {
      value: 'requirement',
      label: 'Requirements',
      content: getDocumentContent('requirement', documents.requirement?.content),
      available: !!(documents.requirement || (currentPhase === 'DISCOVERY' && liveContent)),
      icon: FileText,
    },
    {
      value: 'architecture',
      label: 'Architecture',
      content: getDocumentContent('architecture', documents.architecture?.content),
      available: !!(documents.architecture || (currentPhase === 'FEATURE_BENCHMARK' && liveContent)),
      icon: FileText,
    },
    {
      value: 'development',
      label: 'Development',
      content: getDocumentContent('development', documents.development?.content),
      available: !!(documents.development || (currentPhase === 'MARKET_POSITIONING' && liveContent)),
      icon: FileText,
    },
  ]

  // Outer level tabs (with Documents as a single tab)
  const availableTabs = [
    { value: 'documents', label: 'Documents', available: hasAnyDocument, icon: FileText },
    { value: 'preview', label: 'Preview', available: !readOnly && !!documents.development, icon: Eye },
    { value: 'code', label: 'Code', available: !readOnly && !!documents.development, icon: Code },
  ].filter((t) => t.available)

  // Inner document tabs (for the nested tabs inside Documents)
  const availableDocumentTabs = documentTabs.filter((t) => t.available)

  // Compute effective document sub-tab
  const effectiveDocumentTab = (() => {
    // Priority 1: Current phase with content (saved or live)
    if (currentPhase === 'MARKET_POSITIONING' && (documents.development || liveContent)) return 'development'
    if (currentPhase === 'FEATURE_BENCHMARK' && (documents.architecture || liveContent)) return 'architecture'
    if (currentPhase === 'DISCOVERY' && (documents.requirement || liveContent)) return 'requirement'
    // Priority 2: Any saved documents (reverse order to show latest)
    if (documents.development) return 'development'
    if (documents.architecture) return 'architecture'
    if (documents.requirement) return 'requirement'
    // Priority 3: Default to requirement (for when only live content exists)
    return 'requirement'
  })()

  // Update activeDocumentTab when computed value changes
  useEffect(() => {
    if (effectiveDocumentTab !== activeDocumentTab) {
      setActiveDocumentTab(effectiveDocumentTab)
    }
  }, [effectiveDocumentTab])

  // Fetch MVP data only when user switches to preview or code tab
  useEffect(() => {
    if (chatId && documents.development && (effectiveActiveTab === 'preview' || effectiveActiveTab === 'code')) {
      apiClient
        .get(`/api/mvp/${chatId}`)
        .then((res) => {
          if (res.data && res.data.files) {
            setMvpData({
              files: res.data.files,
            })
          }
        })
        .catch(() => {})
    }
  }, [chatId, documents.development, effectiveActiveTab])

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
      // Copy all three documents
      const allDocs = [
        documents.requirement && `# Requirements Analysis Document\n\n${documents.requirement.content}`,
        documents.architecture && `# Technical Architecture Document\n\n${documents.architecture.content}`,
        documents.development && `# Development Plan Document\n\n${documents.development.content}`,
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
