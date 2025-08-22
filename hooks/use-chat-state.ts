'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { chatApi } from '@/api/chat'
import { useChatStore } from '@/stores/chat'
import { useSession } from '@/hooks/use-session'
import { Message } from '@/types/chat'
import { logger } from '@/libs/config'
import { MessageSignalProcessor, SignalProcessorCallbacks } from '@/libs/message-signal-processor'

export interface ChatStateHookResult {
  // Data
  chat: any
  messages: Message[]
  localMessages: Message[]

  // Loading states
  chatLoading: boolean
  messagesLoading: boolean
  isTyping: boolean

  // Input state
  input: string
  setInput: (value: string) => void

  // Streaming state
  streamingContent: string

  // Requirement state
  requirementSubmitted: boolean
  setRequirementSubmitted: (value: boolean) => void

  // Scroll state
  userScrolled: boolean
  messagesEndRef: React.RefObject<HTMLDivElement>
  scrollAreaRef: React.RefObject<HTMLDivElement>

  // Actions
  handleSend: () => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  handleRequirementSubmitted: (requirement: string) => void
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void
  scrollToBottom: () => void

  // Mutations
  sendMessageMutation: any

  // Message processing
  processStreamChunk: (chunk: string) => Promise<void>

  // Refs
  pendingSignalBufferRef: React.MutableRefObject<string>
  fullAIResponseRef: React.MutableRefObject<string>

  // Signal processor
  setSignalCallbacks: (callbacks: SignalProcessorCallbacks) => void
}

export const useChatState = (chatId: string): ChatStateHookResult => {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { setActiveChat, setMessages, addMessage, updateMessage, removeMessage } = useChatStore()

  // State
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [requirementSubmitted, setRequirementSubmitted] = useState(false)
  const [userScrolled, setUserScrolled] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const pendingSignalBufferRef = useRef('')
  const fullAIResponseRef = useRef('')
  const signalProcessorRef = useRef<MessageSignalProcessor | null>(null)

  // Queries
  const { data: chat, isLoading: chatLoading } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => chatApi.getById(chatId),
    enabled: !!chatId,
  })

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => chatApi.getMessages(chatId),
    enabled: !!chatId,
  })

  // Scroll handling
  const scrollToBottom = useCallback(() => {
    if (!userScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [userScrolled])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50
    setUserScrolled(!isAtBottom)
  }, [])

  // Signal processor setup
  const setSignalCallbacks = useCallback((callbacks: SignalProcessorCallbacks) => {
    signalProcessorRef.current = new MessageSignalProcessor(callbacks)
  }, [])

  // Message processing
  const processStreamChunk = useCallback(async (chunk: string) => {
    // Add current chunk to any pending signal buffer
    pendingSignalBufferRef.current += chunk

    // Process complete lines only (ending with \n)
    let lines = pendingSignalBufferRef.current.split('\n')
    // Keep the last incomplete line in buffer
    pendingSignalBufferRef.current = lines.pop() || ''

    // Process each complete line
    for (const line of lines) {
      let shouldDisplay = true

      // Log the line being processed for debugging
      if (line.includes('__DOCUMENTS_GENERATED__') || line.includes('__DOCUMENT_GENERATION_START__') || line.includes('__GENERATION_PROGRESS__')) {
        console.log('[DEBUG] Processing signal line:', line.substring(0, 100) + '...')
      }

      // Process signals using the signal processor
      if (signalProcessorRef.current) {
        shouldDisplay = signalProcessorRef.current.processLine(line)
      }

      // Display the line if it doesn't contain signals
      if (shouldDisplay && line.trim()) {
        fullAIResponseRef.current += line + '\n'
        setStreamingContent((prev) => prev + line + '\n')
      }
    }
  }, [])

  // Create temp message helper
  const createTempMessage = useCallback(
    (content: string): Message => {
      return {
        id: `temp-${Date.now()}`,
        content,
        role: 'user',
        chatId,
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    },
    [chatId]
  )

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, tempMessageId }: { content: string; tempMessageId: string }) => {
      try {
        const userMessage = await chatApi.sendMessage({
          content,
          role: 'user',
          chatId,
        })

        setLocalMessages((prev) => prev.map((msg) => (msg.id === tempMessageId ? userMessage : msg)))
        updateMessage(tempMessageId, userMessage)

        setIsTyping(true)
        setStreamingContent('')
        fullAIResponseRef.current = ''

        return new Promise<void>((resolve, reject) => {
          chatApi.streamAIResponse(
            chatId,
            content,
            processStreamChunk,
            () => {
              // Create AI message immediately to avoid flashing
              const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                content: fullAIResponseRef.current,
                role: 'assistant',
                chatId,
                userId: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }

              setLocalMessages((prev) => [...prev, aiMessage])
              setIsTyping(false)
              setStreamingContent('')

              // Invalidate queries in background without affecting UI
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
                queryClient.invalidateQueries({ queryKey: ['chats'] })
              }, 100)

              resolve()
            },
            (error: Error) => {
              setIsTyping(false)
              setStreamingContent('')
              toast.error('Failed to get AI response')
              logger.error('Stream error:', error)
              reject(error)
            }
          )
        })
      } catch (error) {
        setLocalMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId))
        removeMessage(tempMessageId)
        throw error
      }
    },
    onError: (error) => {
      setIsTyping(false)
      setStreamingContent('')
      toast.error('send message error')
      logger.error('Send message error:', error)
    },
  })

  // Actions
  const handleSend = useCallback(() => {
    if (!input.trim() || sendMessageMutation.isPending || isTyping) return

    const content = input.trim()
    setInput('')

    const tempMessage = createTempMessage(content)
    setLocalMessages((prev) => [...prev, tempMessage])
    addMessage(tempMessage)
    sendMessageMutation.mutate({ content, tempMessageId: tempMessage.id })
  }, [input, sendMessageMutation, isTyping, createTempMessage, addMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleRequirementSubmitted = useCallback(
    (requirement: string) => {
      setRequirementSubmitted(true)

      const tempMessage = createTempMessage(requirement)
      setLocalMessages((prev) => [...prev, tempMessage])
      addMessage(tempMessage)
      sendMessageMutation.mutate({
        content: requirement,
        tempMessageId: tempMessage.id,
      })
    },
    [createTempMessage, addMessage, sendMessageMutation]
  )

  // Effects
  useEffect(() => {
    if (chat) {
      setActiveChat(chat)
    }
  }, [chat, setActiveChat])

  useEffect(() => {
    if (messages) {
      if (messages.length > 0) {
        setRequirementSubmitted(true)
      }

      setLocalMessages((prevLocal) => {
        const tempMessages = prevLocal.filter(
          (msg) => (msg.id.startsWith('temp-') || msg.id.startsWith('ai-')) && msg.chatId === chatId
        )

        if (tempMessages.length > 0) {
          const serverMessageIds = new Set(messages.map((msg) => msg.id))
          const uniqueTempMessages = tempMessages.filter((tempMsg) => {
            if (tempMsg.id.startsWith('temp-')) {
              return !serverMessageIds.has(tempMsg.id.replace('temp-', ''))
            }
            if (tempMsg.id.startsWith('ai-')) {
              return !messages.some(
                (serverMsg) =>
                  serverMsg.role === 'assistant' &&
                  serverMsg.content === tempMsg.content &&
                  Math.abs(new Date(serverMsg.createdAt).getTime() - new Date(tempMsg.createdAt).getTime()) < 5000
              )
            }
            return true
          })

          return [...messages, ...uniqueTempMessages]
        }
        return messages
      })
      setMessages(messages)
    }
  }, [messages, setMessages, chatId])

  useEffect(() => {
    scrollToBottom()
  }, [localMessages, streamingContent, scrollToBottom])

  useEffect(() => {
    setUserScrolled(false)
    setRequirementSubmitted(false)
  }, [chatId])

  useEffect(() => {
    if (messages && messages.length > 0) {
      setRequirementSubmitted(true)
    }
  }, [messages, chatId])

  // Auto-send initial requirement as first message if chat has description but no messages
  useEffect(() => {
    if (
      chat?.description &&
      chat.description.trim() &&
      messages &&
      messages.length === 0 &&
      !requirementSubmitted &&
      !sendMessageMutation.isPending
    ) {
      handleRequirementSubmitted(chat.description)
    }
  }, [chat, messages, requirementSubmitted, sendMessageMutation.isPending, handleRequirementSubmitted])

  return {
    // Data
    chat,
    messages: messages || [],
    localMessages,

    // Loading states
    chatLoading,
    messagesLoading,
    isTyping,

    // Input state
    input,
    setInput,

    // Streaming state
    streamingContent,

    // Requirement state
    requirementSubmitted,
    setRequirementSubmitted,

    // Scroll state
    userScrolled,
    messagesEndRef,
    scrollAreaRef,

    // Actions
    handleSend,
    handleKeyDown,
    handleRequirementSubmitted,
    handleScroll,
    scrollToBottom,

    // Mutations
    sendMessageMutation,

    // Message processing
    processStreamChunk,

    // Refs
    pendingSignalBufferRef,
    fullAIResponseRef,

    // Signal processor
    setSignalCallbacks,
  }
}
