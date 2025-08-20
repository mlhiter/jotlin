'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Paperclip, Bot, User } from 'lucide-react'
import { toast } from 'sonner'

import { chatApi } from '@/api/chat'
import { documentApi } from '@/api/document'
import { convertMarkdownToBlocks } from '@/libs/markdown-to-blocknote'
import { useChatStore } from '@/stores/chat'
import { Message } from '@/types/chat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/libs/utils'
import { RequirementGenerator } from '@/components/requirement-generator'
import DocumentGenerationProgress from '@/components/document-generation-progress'
import { useDocumentGeneration } from '@/hooks/use-document-generation'
import ChatExportMenu from '@/components/chat-export-menu'
import ChatInvite from '@/components/chat-invite'
import { useSession } from '@/hooks/use-session'

// Helper function to get user initials
const getInitials = (name: string | null, email: string) => {
  if (name && name.trim()) {
    return name
      .trim()
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email.slice(0, 2).toUpperCase()
}

const ChatPage = () => {
  const params = useParams()
  const chatId = params.chatId as string
  const queryClient = useQueryClient()
  const { user } = useSession()
  const {
    setActiveChat,
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
  } = useChatStore()

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [requirementSubmitted, setRequirementSubmitted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [userScrolled, setUserScrolled] = useState(false)
  const {
    state: documentGenerationState,
    startGeneration,
    updateProgress,
    nextDocument,
    completeGeneration,
    setError: setGenerationError,
    reset: resetGeneration,
  } = useDocumentGeneration()

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

  const scrollToBottom = () => {
    if (!userScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50
    setUserScrolled(!isAtBottom)
  }

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      tempMessageId,
    }: {
      content: string
      tempMessageId: string
    }) => {
      try {
        const userMessage = await chatApi.sendMessage({
          content,
          role: 'user',
          chatId,
        })

        setLocalMessages((prev) =>
          prev.map((msg) => (msg.id === tempMessageId ? userMessage : msg))
        )
        updateMessage(tempMessageId, userMessage)

        setIsTyping(true)
        setStreamingContent('')

        return new Promise<void>((resolve, reject) => {
          let fullAIResponse = ''
          let pendingSignalBuffer = ''

          chatApi.streamAIResponse(
            chatId,
            content,
            async (chunk: string) => {
              // Add current chunk to any pending signal buffer
              pendingSignalBuffer += chunk

              // Process complete lines only (ending with \n)
              let lines = pendingSignalBuffer.split('\n')
              // Keep the last incomplete line in buffer
              pendingSignalBuffer = lines.pop() || ''

              // Process each complete line
              for (const line of lines) {
                let displayLine = true

                // Check for generation progress signal
                if (line.includes('__GENERATION_PROGRESS__:')) {
                  const signalStart = line.indexOf('__GENERATION_PROGRESS__:')
                  const signalData = line
                    .substring(signalStart + '__GENERATION_PROGRESS__:'.length)
                    .trim()

                  try {
                    const progressData = JSON.parse(signalData)
                    console.log('Generation progress update:', progressData)
                    updateProgress(progressData)
                    displayLine = false // Don't display this line
                  } catch (error) {
                    console.error(
                      'Failed to parse generation progress signal:',
                      error,
                      'Full line:',
                      line,
                      'Extracted data:',
                      signalData
                    )
                  }
                }

                // Check for document generation start signal
                if (line.includes('__DOCUMENT_GENERATION_START__:')) {
                  const signalStart = line.indexOf(
                    '__DOCUMENT_GENERATION_START__:'
                  )
                  const signalData = line
                    .substring(
                      signalStart + '__DOCUMENT_GENERATION_START__:'.length
                    )
                    .trim()

                  try {
                    const data = JSON.parse(signalData)
                    console.log('Document generation started:', data)
                    // Initialize with analyzing state
                    startGeneration([
                      { title: '正在分析需求...', content: '' },
                      { title: '生成需求文档...', content: '' },
                      { title: '创建文档结构...', content: '' },
                    ])
                    displayLine = false // Don't display this line
                  } catch (error) {
                    console.error(
                      'Failed to parse generation start signal:',
                      error,
                      'Full line:',
                      line,
                      'Extracted data:',
                      signalData
                    )
                  }
                }

                // Check for documents generated signal
                if (line.includes('__DOCUMENTS_GENERATED__:')) {
                  const signalStart = line.indexOf('__DOCUMENTS_GENERATED__:')
                  const signalData = line
                    .substring(signalStart + '__DOCUMENTS_GENERATED__:'.length)
                    .trim()

                  try {
                    const documentData = JSON.parse(signalData)
                    console.log(
                      'Successfully parsed document generation signal:',
                      documentData
                    )

                    // Replace placeholder with real documents
                    startGeneration(documentData.documents)

                    await handleDocumentGeneration(
                      documentData.documents,
                      documentData.chatId
                    )
                    displayLine = false // Don't display this line
                  } catch (error) {
                    console.error(
                      'Failed to parse document generation signal:',
                      error,
                      'Full line:',
                      line,
                      'Extracted data:',
                      signalData
                    )
                  }
                }

                // Display the line if it doesn't contain signals or if signal parsing failed
                if (displayLine && line.trim()) {
                  fullAIResponse += line + '\n'
                  setStreamingContent((prev) => prev + line + '\n')
                }
              }
            },
            () => {
              // Create AI message immediately to avoid flashing
              const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                content: fullAIResponse,
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
                queryClient.invalidateQueries({
                  queryKey: ['messages', chatId],
                })
                queryClient.invalidateQueries({ queryKey: ['chats'] })
              }, 100)

              resolve()
            },
            (error: Error) => {
              setIsTyping(false)
              setStreamingContent('')
              toast.error('Failed to get AI response')
              console.error('Stream error:', error)
              reject(error)
            }
          )
        })
      } catch (error) {
        setLocalMessages((prev) =>
          prev.filter((msg) => msg.id !== tempMessageId)
        )
        removeMessage(tempMessageId)
        throw error
      }
    },
    onError: (error) => {
      setIsTyping(false)
      setStreamingContent('')
      toast.error('send message error')
      console.error('Send message error:', error)
    },
  })

  useEffect(() => {
    if (chat) {
      setActiveChat(chat)
    }
  }, [chat, setActiveChat])

  useEffect(() => {
    if (messages) {
      // Check if there are existing messages to determine if requirement was already submitted
      if (messages.length > 0) {
        setRequirementSubmitted(true)
      }

      setLocalMessages((prevLocal) => {
        // Only keep temp messages from the current chat, not from previous chats
        const tempMessages = prevLocal.filter(
          (msg) =>
            (msg.id.startsWith('temp-') || msg.id.startsWith('ai-')) &&
            msg.chatId === chatId
        )

        if (tempMessages.length > 0) {
          // Filter out messages that already exist in server response
          const serverMessageIds = new Set(messages.map((msg) => msg.id))
          const uniqueTempMessages = tempMessages.filter((tempMsg) => {
            // For temp messages, check if real version exists
            if (tempMsg.id.startsWith('temp-')) {
              return !serverMessageIds.has(tempMsg.id.replace('temp-', ''))
            }
            // For AI messages, keep them unless exact same content exists
            if (tempMsg.id.startsWith('ai-')) {
              return !messages.some(
                (serverMsg) =>
                  serverMsg.role === 'assistant' &&
                  serverMsg.content === tempMsg.content &&
                  Math.abs(
                    new Date(serverMsg.createdAt).getTime() -
                      new Date(tempMsg.createdAt).getTime()
                  ) < 5000
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
  }, [localMessages, streamingContent])

  useEffect(() => {
    setUserScrolled(false)
    // Don't clear localMessages immediately - let it be handled by the messages effect
    setRequirementSubmitted(false)
    resetGeneration() // Reset document generation state when switching chats
  }, [chatId, resetGeneration])

  // Separate effect to handle requirementSubmitted based on messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      setRequirementSubmitted(true)
    }
  }, [messages, chatId])

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending || isTyping) return

    const content = input.trim()
    setInput('')

    // Create and display temporary message immediately
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      role: 'user',
      chatId,
      userId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setLocalMessages((prev) => [...prev, tempMessage])
    addMessage(tempMessage)
    sendMessageMutation.mutate({ content, tempMessageId: tempMessage.id })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRequirementSubmitted = useCallback(
    (requirement: string) => {
      setRequirementSubmitted(true)

      // Create and display temporary message immediately
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content: requirement,
        role: 'user',
        chatId,
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setLocalMessages((prev) => [...prev, tempMessage])
      addMessage(tempMessage)
      sendMessageMutation.mutate({
        content: requirement,
        tempMessageId: tempMessage.id,
      })
    },
    [chatId, addMessage, sendMessageMutation.mutate, setLocalMessages]
  )

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
      // Automatically submit the initial requirement
      handleRequirementSubmitted(chat.description)
    }
  }, [
    chat,
    messages,
    requirementSubmitted,
    sendMessageMutation.isPending,
    handleRequirementSubmitted,
  ])

  const handleDocumentGeneration = async (documents: any[], chatId: string) => {
    try {
      let createdCount = 0

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]
        try {
          // Convert markdown content to BlockNote format
          const blocks = await convertMarkdownToBlocks(doc.content)

          // Create document with BlockNote content
          const documentId = await documentApi.create({
            title: doc.title,
            parentDocument: null,
          })

          // Update document content after creation
          // Send blocks directly, not as JSON string
          await fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: documentId,
              title: doc.title,
              content: JSON.stringify(blocks), // Store as JSON string for database
              chatId: chatId, // Link to current chat
            }),
          })

          createdCount++
          nextDocument() // Update progress
        } catch (error) {
          console.error(`Failed to create document "${doc.title}":`, error)
        }
      }

      if (createdCount > 0) {
        completeGeneration()
        toast.success(`Success to create ${createdCount} documents`)
        // Refresh the chat to show linked documents
        queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
        // Refresh documents list in navigation
        queryClient.invalidateQueries({ queryKey: ['documents'] })
        // Refresh chats list to show updated document count and trigger auto-expand
        queryClient.invalidateQueries({ queryKey: ['chats'] })
      } else {
        setGenerationError('Create documents failed')
        toast.error('Create documents failed')
      }
    } catch (error) {
      console.error('Failed to handle document generation:', error)
      setGenerationError('Create documents failed')
      toast.error('Create documents failed')
    }
  }

  if (chatLoading || messagesLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="ml-auto h-16 w-1/2" />
          <Skeleton className="h-16 w-2/3" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with embedded requirement generator */}
      <div className="border-b">
        <div className="flex items-center justify-between p-4 pb-2">
          <h1 className="text-xl font-semibold">{chat?.title}</h1>
          <div className="flex items-center gap-2">
            <ChatInvite chatId={chatId} />
            {chat?.documents && chat.documents.length > 0 && (
              <ChatExportMenu
                chatId={chatId}
                chatTitle={chat.title}
                chatDescription={chat.description || undefined}
                documents={chat.documents}
                disabled={chatLoading}
              />
            )}
            {!requirementSubmitted ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Scroll to requirement generator
                  const reqGenerator = document.getElementById(
                    'requirement-generator'
                  )
                  reqGenerator?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-sm text-muted-foreground hover:text-foreground">
                Start inputting requirement →
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground">
                ✅ Requirement submitted, you can start chatting
              </div>
            )}
          </div>
        </div>

        {/* Requirement Generator - Always visible in header area */}
        {!requirementSubmitted && (
          <div className="px-4 pb-4" id="requirement-generator">
            <RequirementGenerator
              isEmbedded={true}
              onRequirementSubmitted={handleRequirementSubmitted}
              onDocumentCreated={() => {
                toast.success('Documents created')
                // Refresh linked documents
                queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
              }}
              className="rounded-lg bg-muted/50 p-4"
            />
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea
        className="flex-1 p-4"
        ref={scrollAreaRef}
        onScrollCapture={handleScroll}>
        <div className="space-y-4">
          {localMessages.map((message) => {
            // For user messages, use the message's user info if available, otherwise current user
            const messageUser =
              message.role === 'user' && message.user ? message.user : user
            const displayName =
              messageUser?.name || messageUser?.email || 'Unknown User'

            return (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}>
                <div
                  className={cn(
                    'flex flex-col items-center gap-1',
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}>
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {message.role === 'user' ? (
                      <>
                        <AvatarImage src={messageUser?.image || undefined} />
                        <AvatarFallback className="bg-blue-500 text-xs font-medium text-white">
                          {messageUser?.email ? (
                            getInitials(messageUser.name, messageUser.email)
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-primary">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>

                  {/* User Name */}
                  <span className="max-w-20 truncate text-xs text-muted-foreground">
                    {message.role === 'user' ? displayName : 'AI助手'}
                  </span>
                </div>

                {/* Message Content */}
                <div
                  className={cn(
                    'max-w-[70%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}>
                  <p className="whitespace-pre-wrap">
                    {message.content
                      ?.replace(/__DOCUMENTS_GENERATED__:.*?\n/g, '')
                      ?.replace(/__DOCUMENT_GENERATION_START__:.*?\n/g, '')
                      ?.replace(/__GENERATION_PROGRESS__:.*?\n/g, '')}
                  </p>
                  <p className="mt-1 text-xs opacity-70">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )
          })}

          {(isTyping || streamingContent) && (
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-start gap-1">
                {/* AI Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </AvatarFallback>
                </Avatar>

                {/* AI Name */}
                <span className="max-w-20 truncate text-xs text-muted-foreground">
                  AI助手
                </span>
              </div>

              {/* AI Message Content */}
              <div className="max-w-[70%] rounded-lg bg-muted px-4 py-2">
                {streamingContent ? (
                  <div>
                    <p className="whitespace-pre-wrap">
                      {streamingContent
                        ?.replace(/__DOCUMENTS_GENERATED__:.*?\n/g, '')
                        ?.replace(/__DOCUMENT_GENERATION_START__:.*?\n/g, '')
                        ?.replace(/__GENERATION_PROGRESS__:.*?\n/g, '')}
                    </p>
                    <div className="mt-2 flex space-x-1">
                      <div className="h-1 w-1 animate-pulse rounded-full bg-gray-500" />
                      <div className="h-1 w-1 animate-pulse rounded-full bg-gray-500 delay-100" />
                      <div className="h-1 w-1 animate-pulse rounded-full bg-gray-500 delay-200" />
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 delay-100" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 delay-200" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document Generation Progress */}
          {documentGenerationState.documents.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-start gap-1">
                {/* AI Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </AvatarFallback>
                </Avatar>

                {/* AI Name */}
                <span className="max-w-20 truncate text-xs text-muted-foreground">
                  AI助手
                </span>
              </div>

              {/* Document Generation Content */}
              <div className="max-w-[85%]">
                <DocumentGenerationProgress
                  documents={documentGenerationState.documents}
                  currentDocumentIndex={
                    documentGenerationState.currentDocumentIndex
                  }
                  isGenerating={documentGenerationState.isGenerating}
                  error={documentGenerationState.error}
                  overallProgress={documentGenerationState.overallProgress}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="mb-1">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              requirementSubmitted
                ? 'Enter message...'
                : 'Please input the requirement first...'
            }
            className="max-h-[120px] min-h-[40px] resize-none"
            disabled={
              !requirementSubmitted || sendMessageMutation.isPending || isTyping
            }
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="mb-1"
            disabled={
              !requirementSubmitted ||
              !input.trim() ||
              sendMessageMutation.isPending ||
              isTyping
            }>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
