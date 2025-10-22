'use client'

import { ChevronsLeft, ChevronsRight, Copy, FileText, Eye, Code, Maximize2, Minimize2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { Markdown } from '@/components/chat/markdown'
import { TextSelectionMenu } from '@/components/chat/text-selection-menu'
import { GenerateButton } from '@/components/mvp/generate-button'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import apiClient from '@/libs/utils/axios'

// NOTE: turbopack will cause dev refresh error,so I do not use turbopack to solve this problem
const PreviewLoader = () => {
  const t = useTranslations('chat')
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-muted-foreground">{t('loadingPreview')}</div>
    </div>
  )
}

const Preview = dynamic(() => import('@/components/mvp/preview').then((mod) => ({ default: mod.Preview })), {
  ssr: false,
  loading: PreviewLoader,
})

const CodeViewerLoader = () => {
  const t = useTranslations('chat')
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-muted-foreground">{t('loadingCodeViewer')}</div>
    </div>
  )
}

const CodeViewer = dynamic(() => import('@/components/mvp/code-viewer').then((mod) => ({ default: mod.CodeViewer })), {
  ssr: false,
  loading: CodeViewerLoader,
})

interface DraftPanelProps {
  draft?: string
  final?: string
  isVisible?: boolean
  onToggle?: () => void
  onQuote?: (selectedText: string) => void
  chatId?: string
  activeTab?: string
  onActiveTabChange?: (tab: string) => void
}

export function DraftPanel({
  draft,
  final,
  isVisible = true,
  onToggle,
  onQuote,
  chatId,
  activeTab: externalActiveTab,
  onActiveTabChange,
}: DraftPanelProps) {
  const t = useTranslations('chat')
  const content = final || draft
  const isDraft = !final && draft

  const [internalActiveTab, setInternalActiveTab] = useState('draft')
  const activeTab = externalActiveTab ?? internalActiveTab
  const setActiveTab = onActiveTabChange ?? setInternalActiveTab

  const [mvpData, setMvpData] = useState<{
    files: Record<string, string>
  } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (chatId && final) {
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
  }, [chatId, final])

  const handleCopy = async () => {
    if (content) {
      try {
        await navigator.clipboard.writeText(content)
        toast.success(t('copiedToClipboard'))
      } catch (err) {
        console.error('Failed to copy text: ', err)
        toast.error(t('failedToCopyText'))
      }
    }
  }

  const handleGenerateSuccess = (data: { files: Record<string, string> }) => {
    setMvpData({ files: data.files })
    setActiveTab('preview')
  }

  const panelWidth = activeTab === 'draft' ? 'w-[min(40vw,600px)]' : 'w-[min(65vw,1200px)]'

  const canFullscreen = activeTab === 'preview' || activeTab === 'code'

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
            <TabsList>
              <TabsTrigger value="draft" className="gap-1.5">
                <FileText className="h-3 w-3" />
                {isDraft ? t('draft') : t('final')}
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={!mvpData} className="gap-1.5">
                <Eye className="h-3 w-3" />
                {t('preview')}
              </TabsTrigger>
              <TabsTrigger value="code" disabled={!mvpData} className="gap-1.5">
                <Code className="h-3 w-3" />
                {t('code')}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {canFullscreen && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsFullscreen(false)}
                  className="h-8 w-8"
                  title={t('exitFullscreen')}>
                  <Minimize2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="draft" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="relative p-4" data-selection-container>
                <Markdown content={content || ''} />
                <TextSelectionMenu onQuote={onQuote} />

                {final && chatId && (
                  <div className="mt-6 border-t border-border pt-4">
                    <GenerateButton requirements={final} chatId={chatId} onSuccess={handleGenerateSuccess} />
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="preview"
            className="mt-0 flex-1 overflow-hidden"
            forceMount
            hidden={activeTab !== 'preview'}>
            {mvpData ? (
              <Preview files={mvpData.files} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">{t('noPreviewAvailable')}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="code" className="mt-0 flex-1 overflow-hidden" forceMount hidden={activeTab !== 'code'}>
            {mvpData ? (
              <CodeViewer files={mvpData.files} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">{t('noCodeAvailable')}</p>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <TabsList>
                <TabsTrigger value="draft" className="gap-1.5">
                  <FileText className="h-3 w-3" />
                  {isDraft ? t('draft') : t('final')}
                </TabsTrigger>
                <TabsTrigger value="preview" disabled={!mvpData} className="gap-1.5">
                  <Eye className="h-3 w-3" />
                  {t('preview')}
                </TabsTrigger>
                <TabsTrigger value="code" disabled={!mvpData} className="gap-1.5">
                  <Code className="h-3 w-3" />
                  {t('code')}
                </TabsTrigger>
              </TabsList>

              <div className="mr-6 flex items-center gap-2">
                {activeTab === 'draft' && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-8 w-8"
                    title={t('copyAllContent')}>
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
                {canFullscreen && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsFullscreen(true)}
                    className="h-8 w-8"
                    title={t('fullscreen')}>
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="draft" className="mt-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="relative p-4" data-selection-container>
                  <Markdown content={content || ''} />
                  <TextSelectionMenu onQuote={onQuote} />

                  {final && chatId && (
                    <div className="mt-6 border-t border-border pt-4">
                      <GenerateButton requirements={final} chatId={chatId} onSuccess={handleGenerateSuccess} />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="preview"
              className="mt-0 flex-1 overflow-hidden"
              forceMount
              hidden={activeTab !== 'preview'}>
              {mvpData ? (
                <Preview files={mvpData.files} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">{t('noPreviewAvailable')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" className="mt-0 flex-1 overflow-hidden" forceMount hidden={activeTab !== 'code'}>
              {mvpData ? (
                <CodeViewer files={mvpData.files} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">{t('noCodeAvailable')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
