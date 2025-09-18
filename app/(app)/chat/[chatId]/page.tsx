'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useParams, useSearchParams, notFound } from 'next/navigation'
import { useState, useEffect } from 'react'

import { ChatInput } from '@/components/chat/chat-input'
import { DraftPanel } from '@/components/chat/draft-panel'
import { MessageList } from '@/components/chat/message-list'
import { PageHeader } from '@/components/page-header'

import { SelectedOption } from '@/hooks/use-selected-options'
import apiClient, { getAuthToken } from '@/lib/axios'
import { cn } from '@/lib/utils'
import { parseAIResponse } from '@/lib/xml-parser'
import { MyUIMessage } from '@/schema/chat'

export default function ChatIdPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const chatId = params.chatId as string
  const initialMessage = searchParams.get('message')
  // TODO: we need messages
  const { messages, sendMessage, status, stop, setMessages } = useChat<MyUIMessage>({
    id: chatId,
    messages: [],
    transport: new DefaultChatTransport({
      api: `/api/chats/${chatId}`,
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      // send the last user message and last assistant message(update selected status) to the server
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            lastUserMessage: messages[messages.length - 1],
            id,
            lastAssistantMessage: messages.length >= 2 ? messages[messages.length - 2] : null,
          },
        }
      },
    }),
  })

  // Simple regenerate function - resend last user message
  const regenerate = () => {
    const lastUserMessage = messages.findLast((m) => m.role === 'user')
    if (lastUserMessage) {
      sendMessage({ text: lastUserMessage.parts.find((p) => p.type === 'text')?.text || '' })
    }
  }

  const [showRequirementSidebar, setShowRequirementSidebar] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAutoSent, setHasAutoSent] = useState(false)
  const [quotes, setQuotes] = useState<Array<{ id: string; text: string }>>([])

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

        const chatData = response.data
        // Set initial messages from loaded chat data
        if (chatData.messages && chatData.messages.length > 0) {
          setMessages(chatData.messages)
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

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-24px)] flex flex-col overflow-hidden">
        <PageHeader title="Chat" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading chat...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-24px)] flex flex-col overflow-hidden">
      <PageHeader title="Chat" />
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full overflow-hidden relative">
          <div
            className={cn(
              'flex flex-col overflow-hidden transition-all duration-500 ease-in-out',
              showRequirementSidebar ? 'pr-[calc(4/9*100%+1rem)]' : 'pr-0'
            )}
            style={{ width: '100%' }}>
            <MessageList
              messages={filteredMessages}
              status={status}
              onRetry={regenerate}
              onSendMessage={sendMessage}
              onUpdateMessage={handleUpdateMessage}
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

          <div className="absolute top-0 right-0 h-full">
            <DraftPanel
              draft={requirementContent.draft}
              final={requirementContent.final}
              isVisible={showRequirementSidebar}
              onToggle={() => setShowRequirementSidebar(!showRequirementSidebar)}
              onQuote={handleQuote}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
