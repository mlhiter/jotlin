'use client'

import { ChevronsLeft, ChevronsRight, Copy, FileText, Eye, Code, Maximize2, Minimize2, Files } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
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
  const tChat = useTranslations('chat')
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-muted-foreground">{tChat('loadingPreview')}</div>
    </div>
  )
}

const Preview = dynamic(() => import('@/components/mvp/preview').then((mod) => ({ default: mod.Preview })), {
  ssr: false,
  loading: PreviewLoader,
})

const CodeViewerLoader = () => {
  const tChat = useTranslations('chat')
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-muted-foreground">{tChat('loadingCodeViewer')}</div>
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
  currentPhase?: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT' | null
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
}: DraftPanelProps) {
  const tChat = useTranslations('chat')
  const tProject = useTranslations('project')

  const [mvpData, setMvpData] = useState<{
    files: Record<string, string>
  } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [internalActiveTab, setInternalActiveTab] = useState<string | null>(null)
  const [activeDocumentTab, setActiveDocumentTab] = useState<'requirement' | 'architecture' | 'development'>(
    'requirement'
  )

  // Compute effective active tab
  const hasAnyDocument = !!(documents.requirement || documents.architecture || documents.development)
  const effectiveActiveTab =
    externalActiveTab ?? internalActiveTab ?? (hasAnyDocument ? 'documents' : mvpData ? 'preview' : 'documents')

  const setActiveTab = onActiveTabChange ?? setInternalActiveTab

  // Dynamic tab list based on available documents
  const documentTabs = [
    {
      value: 'requirement',
      label: tProject('phaseRequirement'),
      content: documents.requirement?.content,
      available: !!documents.requirement,
      icon: FileText,
    },
    {
      value: 'architecture',
      label: tProject('phaseArchitecture'),
      content: documents.architecture?.content,
      available: !!documents.architecture,
      icon: FileText,
    },
    {
      value: 'development',
      label: tProject('phaseDevelopment'),
      content: documents.development?.content,
      available: !!documents.development,
      icon: FileText,
    },
  ]

  // Outer level tabs (with Documents as a single tab)
  const availableTabs = [
    { value: 'documents', label: tChat('documents'), available: hasAnyDocument, icon: FileText },
    { value: 'preview', label: tChat('preview'), available: !!mvpData, icon: Eye },
    { value: 'code', label: tChat('code'), available: !!mvpData, icon: Code },
  ].filter((t) => t.available)

  // Inner document tabs (for the nested tabs inside Documents)
  const availableDocumentTabs = documentTabs.filter((t) => t.available)

  // Compute effective document sub-tab
  const effectiveDocumentTab = (() => {
    if (currentPhase === 'DEVELOPMENT' && documents.development) return 'development'
    if (currentPhase === 'ARCHITECTURE' && documents.architecture) return 'architecture'
    if (currentPhase === 'REQUIREMENT' && documents.requirement) return 'requirement'
    if (documents.development) return 'development'
    if (documents.architecture) return 'architecture'
    return 'requirement'
  })()

  // Update activeDocumentTab when computed value changes
  useEffect(() => {
    if (effectiveDocumentTab !== activeDocumentTab) {
      setActiveDocumentTab(effectiveDocumentTab)
    }
  }, [effectiveDocumentTab])

  // Fetch MVP data if available (only when development phase is complete)
  useEffect(() => {
    if (chatId && documents.development) {
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
  }, [chatId, documents.development])

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
        toast.success(type === 'current' ? tChat('copiedCurrentDocument') : tChat('copiedAllDocuments'))
      } catch (err) {
        console.error('Failed to copy text: ', err)
        toast.error(tChat('failedToCopyText'))
      }
    }
  }

  const panelWidth = effectiveActiveTab === 'documents' ? 'w-[min(40vw,600px)]' : 'w-[min(65vw,1200px)]'

  const canFullscreen = effectiveActiveTab === 'preview' || effectiveActiveTab === 'code'

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <Tabs value={effectiveActiveTab} onValueChange={setActiveTab} className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
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
                    <Button size="icon" variant="ghost" className="h-8 w-8" title={tChat('copyDocument')}>
                      <Copy className="h-4 w-4 text-muted-foreground" />
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
                        {tChat('copyCurrentDocument')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() => handleCopy('all')}>
                        <Files className="h-4 w-4" />
                        {tChat('copyAllDocuments')}
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
                  title={tChat('exitFullscreen')}>
                  <Minimize2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="documents" className="mt-0 flex h-full flex-col overflow-hidden">
            {/* Nested document tabs */}
            {availableDocumentTabs.length > 1 && (
              <div className="flex items-center gap-1 border-b border-border px-4">
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
                      <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
            {/* Document content */}
            <div className="relative flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="relative p-4" data-selection-container>
                  <Markdown
                    content={
                      (activeDocumentTab === 'requirement' && documents.requirement?.content) ||
                      (activeDocumentTab === 'architecture' && documents.architecture?.content) ||
                      (activeDocumentTab === 'development' && documents.development?.content) ||
                      ''
                    }
                  />
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
                <p className="text-sm text-muted-foreground">{tChat('noPreviewAvailable')}</p>
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
                <p className="text-sm text-muted-foreground">{tChat('noCodeAvailable')}</p>
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
            className={`absolute top-4.5 z-20 h-8 w-8 transition-all duration-500 ease-in-out ${
              isVisible ? 'right-4' : 'left-2'
            }`}>
            {isVisible ? (
              <ChevronsRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronsLeft className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}

        <div
          className={`m-2 flex h-[calc(100%-1rem)] w-full transform flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-700 ease-in-out ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}>
          <Tabs value={effectiveActiveTab} onValueChange={setActiveTab} className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
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
                      <Button size="icon" variant="ghost" className="h-8 w-8" title={tChat('copyDocument')}>
                        <Copy className="h-4 w-4 text-muted-foreground" />
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
                          {tChat('copyCurrentDocument')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start gap-2"
                          onClick={() => handleCopy('all')}>
                          <Files className="h-4 w-4" />
                          {tChat('copyAllDocuments')}
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
                    title={tChat('fullscreen')}>
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="documents" className="mt-0 flex h-full flex-col overflow-hidden">
              {/* Nested document tabs */}
              {availableDocumentTabs.length > 1 && (
                <div className="flex items-center gap-1 border-b border-border px-4">
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
                        <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              {/* Document content */}
              <div className="relative flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="relative p-4" data-selection-container>
                    <Markdown
                      content={
                        (activeDocumentTab === 'requirement' && documents.requirement?.content) ||
                        (activeDocumentTab === 'architecture' && documents.architecture?.content) ||
                        (activeDocumentTab === 'development' && documents.development?.content) ||
                        ''
                      }
                    />
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
                  <p className="text-sm text-muted-foreground">{tChat('noPreviewAvailable')}</p>
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
                  <p className="text-sm text-muted-foreground">{tChat('noCodeAvailable')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
