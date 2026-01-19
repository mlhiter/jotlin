'use client'

import { useChat } from '@ai-sdk/react'
import { useQueryClient } from '@tanstack/react-query'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef } from 'react'

import { ChatInput } from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/message-list'

import { useThreadMessages } from '@/hooks/use-thread-messages'
import apiClient from '@/libs/utils/axios'
import { MyUIMessage } from '@/schema/chat'
import { useAuthStore } from '@/store/auth-store'

interface ChatAreaProps {
  type: 'PROJECT'
  entityId: string // projectId
  workspaceId: string
  currentThreadId: string | null
}

export function ChatArea({ entityId, workspaceId, currentThreadId }: ChatAreaProps) {
  const messageRefs = useRef<Map<string, HTMLElement>>(new Map())
  const queryClient = useQueryClient()

  // Fetch messages with caching
  const { data: cachedMessages, isLoading } = useThreadMessages({
    threadId: currentThreadId,
  })

  const { messages, sendMessage, status, stop, setMessages } = useChat<MyUIMessage>({
    id: currentThreadId || undefined,
    transport: currentThreadId
      ? new DefaultChatTransport({
          api: `/api/chat-threads/${currentThreadId}/messages`,
          headers: () => ({
            Authorization: `Bearer ${useAuthStore.getState().token}`,
          }),
        })
      : undefined,
    onError: (error) => {
      console.error('Chat error:', error)
    },
    onFinish: () => {
      // Invalidate cache when message is complete
      if (currentThreadId) {
        queryClient.invalidateQueries({ queryKey: ['threadMessages', currentThreadId] })
        // Invalidate documents and projects to refresh sidebar when AI creates/updates documents
        queryClient.invalidateQueries({ queryKey: ['documents'] })
        // Invalidate all document detail queries to refresh editor content
        queryClient.invalidateQueries({ queryKey: ['document'] })
        queryClient.invalidateQueries({ queryKey: ['projects'] })
        // Refresh chat threads to update auto-generated title
        queryClient.invalidateQueries({ queryKey: ['chatThreads', entityId] })
      }
    },
  })

  // Sync cached messages to useChat state
  useEffect(() => {
    if (cachedMessages && cachedMessages.length > 0) {
      setMessages(cachedMessages)
    } else if (cachedMessages) {
      setMessages([])
    }
  }, [cachedMessages, setMessages])

  const handleSendMessage = (message: { text: string }) => {
    if (isLoading || status !== 'ready') {
      console.warn('Chat not ready')
      return
    }
    sendMessage(message)
  }

  const handleRetry = () => {
    if (isLoading || status !== 'ready') {
      return
    }
    const lastUserMessage = messages.findLast((m) => m.role === 'user')
    if (lastUserMessage) {
      sendMessage({ text: lastUserMessage.parts.find((p) => p.type === 'text')?.text || '' })
    }
  }

  const handleRollback = async (messageId: string) => {
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex === -1) return

    let rollbackMessages = messages.slice(0, messageIndex + 1)

    // Reset answered state for the last message if it's an assistant message
    const lastMessage = rollbackMessages[rollbackMessages.length - 1]
    if (lastMessage.role === 'assistant' && lastMessage.metadata?.answered) {
      rollbackMessages = rollbackMessages.map((msg, idx) =>
        idx === rollbackMessages.length - 1
          ? {
              ...msg,
              metadata: {
                ...msg.metadata,
                answered: false,
                selectedOptions: undefined,
                inputValue: undefined,
                answeredAt: undefined,
              },
            }
          : msg
      ) as MyUIMessage[]
    }

    setMessages(rollbackMessages)

    // Save rollback to server and invalidate cache
    if (currentThreadId) {
      try {
        await apiClient.patch(`/api/chat-threads/${currentThreadId}/messages`, {
          messages: rollbackMessages,
        })
        // Invalidate the cache to refetch messages
        queryClient.invalidateQueries({ queryKey: ['threadMessages', currentThreadId] })
      } catch (error) {
        console.error('Failed to save rollback:', error)
      }
    }
  }

  const handleUpdateMessage = (messageId: string, metadata: MyUIMessage['metadata']) => {
    setMessages(
      (prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, metadata: { ...msg.metadata, ...metadata } } : msg
        ) as MyUIMessage[]
    )
  }

  const handleStop = () => {
    stop()
  }

  if (!currentThreadId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No conversation selected. Create or select one from the header.</p>
      </div>
    )
  }

  // Filter empty assistant messages
  const filteredMessages = messages.filter((message) => {
    if (message.role === 'assistant') {
      const hasTextContent = message.parts.some((part: any) => part.type === 'text' && part.text.trim().length > 0)
      const hasToolCall = message.parts.some((part: any) => part.type?.startsWith('tool-'))
      return hasTextContent || hasToolCall
    }
    return true
  })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <MessageList
        messages={filteredMessages}
        status={status}
        isLoading={isLoading}
        onRetry={handleRetry}
        onSendMessage={sendMessage}
        onUpdateMessage={handleUpdateMessage}
        onRollback={handleRollback}
        messageRefs={messageRefs}
        workspaceId={workspaceId}
        projectId={entityId}
      />

      <ChatInput
        onSendMessage={handleSendMessage}
        onMarkMessageAnswered={() => {}}
        onStop={handleStop}
        status={status}
        quotes={[]}
        onRemoveQuote={() => {}}
        chatId={currentThreadId}
        onCompetitorSearchComplete={() => {}}
      />
    </div>
  )
}
