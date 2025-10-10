'use client'

import { Calendar, User } from 'lucide-react'
import { useParams, notFound } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'

import { Markdown } from '@/components/chat/markdown'
import { MessageList } from '@/components/chat/message-list'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

import apiClient from '@/lib/axios'
import { parseAIResponse } from '@/lib/xml-parser'
import { MyUIMessage } from '@/schema/chat'

interface PublicChat {
  id: string
  title: string | null
  messages: MyUIMessage[]
  createdAt: string
  updatedAt: string
  author: string
}

export default function ChatPreviewPage() {
  const t = useTranslations('chat')
  const params = useParams()
  const chatId = params.chatId as string

  const [chat, setChat] = useState<PublicChat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPublicChat = async () => {
      try {
        const response = await apiClient.get(`/api/chats/${chatId}/public`)
        setChat(response.data)
      } catch (error) {
        console.error('Failed to load public chat:', error)
        // Check if it's an axios error with 404 status
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number } }
          if (axiosError.response?.status === 404) {
            notFound()
          }
        }
        setError(t('failedToLoadChat'))
      } finally {
        setIsLoading(false)
      }
    }

    if (chatId) {
      loadPublicChat()
    }
  }, [chatId, t])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <div className="text-muted-foreground">{t('loadingChat')}</div>
        </div>
      </div>
    )
  }

  if (error || !chat) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="text-destructive">{error || t('chatNotFound')}</div>
        </div>
      </div>
    )
  }

  // Filter empty assistant messages
  const filteredMessages = chat.messages.filter((message) => {
    if (message.role === 'assistant') {
      const hasContent = message.parts.some((part) => part.type === 'text' && part.text.trim().length > 0)
      return hasContent
    }
    return true
  })

  // Extract document content (draft/final) from messages
  const documentContent = filteredMessages.reduce(
    (acc, message) => {
      if (message.role === 'assistant') {
        message.parts.forEach((part) => {
          if (part.type === 'text') {
            const parsed = parseAIResponse(part.text)
            if (parsed.draft || parsed.final) {
              acc = { draft: parsed.draft, final: parsed.final }
            }
          }
        })
      }
      return acc
    },
    { draft: undefined as string | undefined, final: undefined as string | undefined }
  )

  const hasDocument = documentContent.draft || documentContent.final

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 px-18 py-4">
        <h1 className="text-lg font-semibold">{chat.title || t('untitledChat')}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {chat.author}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(chat.createdAt).toLocaleDateString()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {filteredMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">{t('noMessages')}</div>
          </div>
        ) : (
          <div className="relative flex h-full overflow-hidden py-2">
            {/* Chat Messages - Main Area */}
            <div
              className={
                hasDocument
                  ? 'flex flex-col overflow-hidden pr-[calc(4/9*100%+1rem)] transition-all duration-500 ease-in-out'
                  : 'flex flex-col overflow-hidden'
              }
              style={{ width: '100%' }}>
              <MessageList
                messages={filteredMessages}
                status="ready"
                onRetry={() => {}}
                onSendMessage={() => {}}
                onUpdateMessage={() => {}}
                onRollback={() => {}}
              />
            </div>

            {/* Generated Document - Right Panel */}
            {hasDocument && (
              <div className="absolute top-0 right-0 h-full pr-10">
                <div className="relative h-full">
                  <div className="m-2 flex h-[calc(100%-1rem)] w-[calc((100vw-260px)*(4/9))] translate-x-0 flex-col rounded-lg border border-border bg-card opacity-100 transition-all duration-500 ease-in-out">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-card-foreground">
                          {documentContent.final ? t('final') : t('draft')}
                        </h4>
                        {!documentContent.final && (
                          <Badge variant="secondary" className="text-xs">
                            {t('draft')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ScrollArea className="h-0 flex-1">
                      <div className="relative p-4">
                        <Markdown content={documentContent.final || documentContent.draft || ''} />
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2">
        <div className="text-center text-xs text-muted-foreground">{t('previewFooter')}</div>
      </div>
    </div>
  )
}
