'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import dynamic from 'next/dynamic'
import { useParams, useSearchParams, notFound } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'

import { ChatInput } from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/message-list'
import { PublicButton } from '@/components/chat/public-button'
import { PageHeader } from '@/components/page-header'
import { useSidebar } from '@/components/ui/sidebar'

const DraftPanel = dynamic(() => import('@/components/chat/draft-panel').then((mod) => ({ default: mod.DraftPanel })), {
  ssr: false,
})

import { useMessageLimits } from '@/hooks/use-message-limits'
import { SelectedOption } from '@/hooks/use-selected-options'
import { parseAIResponse } from '@/libs/ai/xml-parser'
import apiClient from '@/libs/utils/axios'
import { MyUIMessage } from '@/schema/chat'
import { useAuthStore } from '@/store/auth-store'

export default function ChatIdPage() {
  const t = useTranslations('chat')
  const params = useParams()
  const searchParams = useSearchParams()
  const chatId = params.chatId as string
  const initialMessage = searchParams.get('message')
  const { handleMessageSent, handleLimitError } = useMessageLimits()

  const token = useAuthStore((state) => state.token)

  // TODO: we need messages
  const { messages, sendMessage, status, stop, setMessages } = useChat<MyUIMessage>({
    id: chatId,
    messages: [],
    transport: new DefaultChatTransport({
      api: `/api/chats/${chatId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    onFinish: () => {
      handleMessageSent()
    },
    onError: (error) => {
      const isLimitError = handleLimitError(error)
      if (!isLimitError) {
        console.error('Chat error:', error)
      }
    },
  })

  // Rollback function - rollback to a specific message and delete all messages after it
  const handleRollback = (messageId: string) => {
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex === -1) return

    // Get messages up to and including the target message
    const rollbackMessages = messages.slice(0, messageIndex + 1)

    // Update the last message if it's an assistant message - set answered to false
    const updatedMessages = rollbackMessages.map((msg, index) => {
      if (index === rollbackMessages.length - 1 && msg.role === 'assistant') {
        return {
          ...msg,
          metadata: {
            ...msg.metadata,
            answered: false,
            selectedOptions: [],
            inputValue: '',
            answeredAt: msg.metadata?.answeredAt || new Date().toISOString(),
          },
        }
      }
      return msg
    }) as MyUIMessage[]

    // Update messages state
    setMessages(updatedMessages)
  }

  // Simple regenerate function - resend last user message (kept for retry button)
  const handleRetry = () => {
    const lastUserMessage = messages.findLast((m) => m.role === 'user')
    if (lastUserMessage) {
      sendMessage({ text: lastUserMessage.parts.find((p) => p.type === 'text')?.text || '' })
    }
  }

  const [showRequirementSidebar, setShowRequirementSidebar] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAutoSent, setHasAutoSent] = useState(false)
  const [quotes, setQuotes] = useState<Array<{ id: string; text: string }>>([])
  const [chatData, setChatData] = useState<{ isPublic: boolean } | null>(null)
  const [draftActiveTab, setDraftActiveTab] = useState('draft')
  const [sidebarStateBeforeCollapse, setSidebarStateBeforeCollapse] = useState<boolean | null>(null)

  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar()

  useEffect(() => {
    const loadChat = async () => {
      try {
        const response = await apiClient.get(`/api/chats/${chatId}`)
        if (response.status !== 200) {
          if (response.status === 404) {
            notFound()
          }
          throw new Error('Failed to load chat')
        }

        const data = response.data
        setChatData(data)
        // Set initial messages from loaded chat data
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load chat:', error)
        notFound()
      }
    }

    if (chatId) {
      loadChat()
    }
  }, [chatId])

  // Auto-send initial message if provided in URL
  useEffect(() => {
    if (initialMessage && !hasAutoSent && !isLoading && status === 'ready') {
      sendMessage({ text: initialMessage })
      setHasAutoSent(true)

      // Clear the message from URL without page reload
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [initialMessage, hasAutoSent, isLoading, status, sendMessage])

  // Filter empty assistant messages
  const filteredMessages = messages.filter((message) => {
    if (message.role === 'assistant') {
      const hasContent = message.parts.some((part) => part.type === 'text' && part.text.trim().length > 0)
      return hasContent
    }
    return true
  })

  // Check if any message has draft or final content
  const requirementContent = filteredMessages.reduce(
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

  // Auto show/hide requirement sidebar
  useEffect(() => {
    if (requirementContent.draft || requirementContent.final) {
      setShowRequirementSidebar(true)
    }
  }, [requirementContent.draft, requirementContent.final])

  // Auto-collapse sidebar when viewing code/preview on smaller screens
  useEffect(() => {
    const shouldCollapseSidebar = (draftActiveTab === 'preview' || draftActiveTab === 'code') && showRequirementSidebar

    if (shouldCollapseSidebar && typeof window !== 'undefined' && window.innerWidth < 1440) {
      if (sidebarStateBeforeCollapse === null) {
        setSidebarStateBeforeCollapse(sidebarOpen)
      }
      setSidebarOpen(false)
    } else if (!shouldCollapseSidebar && sidebarStateBeforeCollapse !== null) {
      setSidebarOpen(sidebarStateBeforeCollapse)
      setSidebarStateBeforeCollapse(null)
    }
  }, [draftActiveTab, showRequirementSidebar, sidebarOpen, sidebarStateBeforeCollapse, setSidebarOpen])

  const cleanupEmptyAssistantMessage = () => {
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role === 'assistant') {
      const hasContent = lastMessage.parts.some((part) => part.type === 'text' && part.text.trim().length > 0)
      if (!hasContent) {
        setMessages((prev) => prev.slice(0, -1))
      }
    }
  }

  useEffect(() => {
    if (status === 'error') {
      setTimeout(() => cleanupEmptyAssistantMessage(), 100)
    }
  }, [status])

  const handleStop = () => {
    stop()
    setTimeout(() => cleanupEmptyAssistantMessage(), 100)
  }

  const handleQuote = (selectedText: string) => {
    const newQuote = {
      id: Date.now().toString(),
      text: selectedText.trim(),
    }
    setQuotes((prev) => [...prev, newQuote])
  }

  const handleRemoveQuote = (id: string) => {
    setQuotes((prev) => prev.filter((quote) => quote.id !== id))
  }

  const handleSendMessage = (message: { text: string }) => {
    setQuotes([])
    sendMessage(message)
  }

  const handleUpdateMessage = (messageId: string, metadata: MyUIMessage['metadata']) => {
    setMessages(
      (prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, metadata: { ...msg.metadata, ...metadata } } : msg
        ) as MyUIMessage[]
    )
  }

  const handleMarkMessageAnswered = (messageId: string, selectedOptions: SelectedOption[]) => {
    setMessages(
      (prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                metadata: {
                  ...msg.metadata,
                  answered: true,
                  selectedOptions: selectedOptions.map((opt) => opt.value),
                  answeredAt: new Date().toISOString(),
                },
              }
            : msg
        ) as MyUIMessage[]
    )
  }

  const handlePublicChange = (isPublic: boolean) => {
    setChatData((prev) => (prev ? { ...prev, isPublic } : null))
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-24px)] flex-col overflow-hidden">
        <PageHeader title={t('title')} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">{t('loadingChat')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-24px)] flex-col overflow-hidden">
      <PageHeader
        title={t('title')}
        actions={
          chatData && <PublicButton chatId={chatId} isPublic={chatData.isPublic} onPublicChange={handlePublicChange} />
        }
      />
      <div className="flex flex-1 items-stretch overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className={`flex h-full flex-col transition-all duration-700 ease-in-out ${
              showRequirementSidebar ? 'mx-0' : 'mx-auto w-full max-w-4xl'
            }`}>
            <MessageList
              messages={filteredMessages}
              status={status}
              onRetry={handleRetry}
              onSendMessage={sendMessage}
              onUpdateMessage={handleUpdateMessage}
              onRollback={handleRollback}
            />

            <ChatInput
              onSendMessage={handleSendMessage}
              onMarkMessageAnswered={handleMarkMessageAnswered}
              onStop={handleStop}
              status={status}
              quotes={quotes}
              onRemoveQuote={handleRemoveQuote}
            />
          </div>
        </div>

        <DraftPanel
          draft={requirementContent.draft}
          final={requirementContent.final}
          isVisible={showRequirementSidebar}
          onToggle={() => setShowRequirementSidebar(!showRequirementSidebar)}
          onQuote={handleQuote}
          chatId={chatId}
          activeTab={draftActiveTab}
          onActiveTabChange={setDraftActiveTab}
        />
      </div>
    </div>
  )
}
