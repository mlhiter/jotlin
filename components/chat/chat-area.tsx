'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Loader2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

import { ChatInput } from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/message-list'

import apiClient from '@/libs/utils/axios'
import { MyUIMessage } from '@/schema/chat'
import { useAuthStore } from '@/store/auth-store'

interface ChatAreaProps {
  type: 'PROJECT'
  entityId: string // projectId
  workspaceId: string
}

export function ChatArea({ type, entityId, workspaceId }: ChatAreaProps) {
  const [chatThreadId, setChatThreadId] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<MyUIMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chatReady, setChatReady] = useState(false)
  const messageRefs = useRef<Map<string, HTMLElement>>(new Map())

  // Load or create chat thread
  useEffect(() => {
    const loadChatThread = async () => {
      try {
        setIsLoading(true)

        // Get existing chat thread for this project
        const params = { projectId: entityId, type: 'PROJECT' }

        const response = await apiClient.get('/api/chat-threads', { params })

        let thread = response.data.threads?.[0]

        // If no thread exists, create one
        if (!thread) {
          const createResponse = await apiClient.post('/api/chat-threads', {
            ...params,
            workspaceId,
          })
          thread = createResponse.data
        }

        setChatThreadId(thread.id)

        // Load messages
        if (thread.messages && thread.messages.length > 0) {
          setInitialMessages(thread.messages)
        }

        setChatReady(true)
      } catch (error) {
        console.error('Failed to load chat thread:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadChatThread()
  }, [type, entityId, workspaceId])

  const { messages, sendMessage, status, stop, setMessages } = useChat<MyUIMessage>({
    id: chatThreadId || undefined,
    messages: initialMessages,
    transport: chatThreadId
      ? new DefaultChatTransport({
          api: `/api/chat-threads/${chatThreadId}/messages`,
          headers: () => ({
            Authorization: `Bearer ${useAuthStore.getState().token}`,
          }),
        })
      : undefined,
    onError: (error) => {
      console.error('Chat error:', error)
    },
  })

  const handleSendMessage = (message: { text: string }) => {
    if (!chatReady || status !== 'ready') {
      console.warn('Chat not ready')
      return
    }
    sendMessage(message)
  }

  const handleRetry = () => {
    if (!chatReady || status !== 'ready') {
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

    // Save rollback to server
    if (chatThreadId) {
      try {
        await apiClient.patch(`/api/chat-threads/${chatThreadId}/messages`, {
          messages: rollbackMessages,
        })
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!chatThreadId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Failed to load chat</p>
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
        chatId={chatThreadId}
        phase={null}
        onCompetitorSearchComplete={() => {}}
      />
    </div>
  )
}
