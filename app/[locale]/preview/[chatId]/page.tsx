'use client'

import { Calendar, User } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'

import { Markdown } from '@/components/chat/markdown'
import { MessageList } from '@/components/chat/message-list'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

import { parseAIResponse } from '@/libs/ai/xml-parser'
import apiClient from '@/libs/utils/axios'
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
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number } }
          if (axiosError.response?.status === 404) {
            // 404 is expected when chat is not public or doesn't exist
            // Don't log this as an error to avoid console noise
            setError(t('linkExpired'))
            return
          }
        }
        console.error('Failed to load public chat:', error)
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
        <div className="mx-auto max-w-md space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{t('linkExpired')}</h3>
            <p className="text-sm text-muted-foreground">{t('linkExpiredDescription')}</p>
          </div>
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
