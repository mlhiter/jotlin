'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useParams, useSearchParams, notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { ChatInput } from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/message-list'
import { PageHeader } from '@/components/page-header'
import { PhaseProgress } from '@/components/project/phase-progress'

import { useMessageLimits } from '@/hooks/use-message-limits'
import apiClient from '@/libs/utils/axios'
import { MyUIMessage } from '@/schema/chat'
import { useAuthStore } from '@/store/auth-store'

export const dynamic = 'force-dynamic'

export default function ChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const chatId = params.chatId as string
  const initialMessage = searchParams.get('message')
  const { handleMessageSent, handleLimitError } = useMessageLimits()

  const [initialMessages, setInitialMessages] = useState<MyUIMessage[]>([])
  const [chatReady, setChatReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [chatData, setChatData] = useState<{
    phase: 'DISCOVERY' | 'FEATURE_BENCHMARK' | 'MARKET_POSITIONING' | 'RECOMMENDATION' | null
    productIdea?: string
    title?: string
  } | null>(null)

  const { messages, sendMessage, status, stop, setMessages } = useChat<MyUIMessage>({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `/api/chats/${chatId}`,
      headers: () => ({
        Authorization: `Bearer ${useAuthStore.getState().token}`,
      }),
    }),
    onFinish: () => {
      handleMessageSent()
    },
    onError: (error) => {
      const isLimitError = handleLimitError(error)
      if (!isLimitError) {
        console.error('Chat error:', error)
        toast.error('An error occurred while processing your message')
      }
    },
  })

  // Load chat data
  useEffect(() => {
    const loadChat = async () => {
      try {
        const response = await apiClient.get(`/api/chats/${chatId}`)
        if (response.status !== 200) {
          if (response.status === 404) notFound()
          throw new Error('Failed to load chat')
        }

        const data = response.data

        if (data.messages && data.messages.length > 0) {
          setInitialMessages(data.messages)
          setMessages(data.messages)
        }

        setChatData({
          phase: data.phase,
          productIdea: data.productIdea,
          title: data.title,
        })
        setIsLoading(false)
        setChatReady(true)

        // Send initial message if provided
        if (initialMessage && data.messages.length === 0) {
          setTimeout(() => {
            sendMessage({ text: initialMessage })
          }, 500)
        }
      } catch (error) {
        console.error('Failed to load chat:', error)
        notFound()
      }
    }

    if (chatId) {
      loadChat()
    }
  }, [chatId])

  const handleRetry = () => {
    if (!chatReady || status !== 'ready') return
    const lastUserMessage = messages.findLast((m) => m.role === 'user')
    if (lastUserMessage) {
      sendMessage({ text: lastUserMessage.parts.find((p) => p.type === 'text')?.text || '' })
    }
  }

  const handleRollback = (messageId: string) => {
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex === -1) return

    const rollbackMessages = messages.slice(0, messageIndex + 1)
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

    setMessages(updatedMessages)
  }

  const handleUpdateMessage = (messageId: string, metadata: MyUIMessage['metadata']) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => (msg.id === messageId ? { ...msg, metadata } : msg))
    )
  }

  // Phase progress configuration
  const phaseProgress = chatData?.phase
    ? [
        {
          phase: 'DISCOVERY' as const,
          status:
            chatData.phase === 'DISCOVERY'
              ? ('in-progress' as const)
              : ('completed' as const),
        },
        {
          phase: 'FEATURE_BENCHMARK' as const,
          status:
            chatData.phase === 'FEATURE_BENCHMARK'
              ? ('in-progress' as const)
              : chatData.phase === 'MARKET_POSITIONING' || chatData.phase === 'RECOMMENDATION'
              ? ('completed' as const)
              : ('pending' as const),
        },
        {
          phase: 'MARKET_POSITIONING' as const,
          status:
            chatData.phase === 'MARKET_POSITIONING'
              ? ('in-progress' as const)
              : chatData.phase === 'RECOMMENDATION'
              ? ('completed' as const)
              : ('pending' as const),
        },
        {
          phase: 'RECOMMENDATION' as const,
          status: chatData.phase === 'RECOMMENDATION' ? ('in-progress' as const) : ('pending' as const),
        },
      ]
    : []

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-1.5rem)] flex-col overflow-hidden">
        <PageHeader title="Competitive Analysis" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading analysis...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-1.5rem)] flex-col overflow-hidden">
      <PageHeader title={chatData?.title || 'Competitive Analysis'} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Phase Progress Bar */}
        {chatData?.phase && (
          <div className="border-b">
            <PhaseProgress phases={phaseProgress} currentPhase={chatData.phase} clickable={false} />
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex h-full flex-col overflow-hidden">
          <MessageList
            messages={messages}
            status={status}
            onRetry={handleRetry}
            onSendMessage={sendMessage}
            onUpdateMessage={handleUpdateMessage}
            onRollback={handleRollback}
          />

          <ChatInput
            onSendMessage={(msg) => sendMessage({ text: msg.text })}
            onMarkMessageAnswered={() => {}}
            onStop={stop}
            status={status}
            quotes={[]}
            onRemoveQuote={() => {}}
          />
        </div>
      </div>
    </div>
  )
}
