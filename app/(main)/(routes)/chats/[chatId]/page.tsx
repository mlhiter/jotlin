'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Paperclip, MoreVertical, FileText, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { chatApi } from '@/api/chat'
import { createDocument } from '@/api/document'
import { convertMarkdownToBlocks } from '@/libs/markdown-to-blocknote'
import { useChatStore } from '@/stores/chat'
import { Message } from '@/types/chat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/libs/utils'
import { ChatDocumentList } from '@/app/(main)/components/chat-document-list'
import { DocumentSelector } from '@/app/(main)/components/document-selector'
import { ChatRequirementIntegration } from '@/components/chat-requirement-integration'
import DocumentGenerationProgress from '@/components/document-generation-progress'
import { useDocumentGeneration } from '@/hooks/use-document-generation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const ChatPage = () => {
  const params = useParams()
  const chatId = params.chatId as string
  const queryClient = useQueryClient()
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
  const [showDocumentSelector, setShowDocumentSelector] = useState(false)
  const [localMessages, setLocalMessages] = useState<Message[]>([])
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
                  const signalData = line.substring(signalStart + '__GENERATION_PROGRESS__:'.length).trim()
                  
                  try {
                    const progressData = JSON.parse(signalData)
                    console.log('Generation progress update:', progressData)
                    updateProgress(progressData)
                    displayLine = false // Don't display this line
                  } catch (error) {
                    console.error('Failed to parse generation progress signal:', error, 'Full line:', line, 'Extracted data:', signalData)
                  }
                }
                
                // Check for document generation start signal
                if (line.includes('__DOCUMENT_GENERATION_START__:')) {
                  const signalStart = line.indexOf('__DOCUMENT_GENERATION_START__:')
                  const signalData = line.substring(signalStart + '__DOCUMENT_GENERATION_START__:'.length).trim()
                  
                  try {
                    const data = JSON.parse(signalData)
                    console.log('Document generation started:', data)
                    // Initialize with analyzing state
                    startGeneration([
                      { title: '正在分析需求...', content: '' },
                      { title: '生成需求文档...', content: '' },
                      { title: '创建文档结构...', content: '' }
                    ])
                    displayLine = false // Don't display this line
                  } catch (error) {
                    console.error('Failed to parse generation start signal:', error, 'Full line:', line, 'Extracted data:', signalData)
                  }
                }
                
                // Check for documents generated signal
                if (line.includes('__DOCUMENTS_GENERATED__:')) {
                  const signalStart = line.indexOf('__DOCUMENTS_GENERATED__:')
                  const signalData = line.substring(signalStart + '__DOCUMENTS_GENERATED__:'.length).trim()
                  
                  try {
                    const documentData = JSON.parse(signalData)
                    console.log('Successfully parsed document generation signal:', documentData)
                    
                    // Replace placeholder with real documents
                    startGeneration(documentData.documents)
                    
                    await handleDocumentGeneration(
                      documentData.documents,
                      documentData.chatId
                    )
                    displayLine = false // Don't display this line
                  } catch (error) {
                    console.error('Failed to parse document generation signal:', error, 'Full line:', line, 'Extracted data:', signalData)
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
      setLocalMessages((prevLocal) => {
        const tempMessages = prevLocal.filter(
          (msg) => msg.id.startsWith('temp-') || msg.id.startsWith('ai-')
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
  }, [messages, setMessages])

  useEffect(() => {
    scrollToBottom()
  }, [localMessages, streamingContent])

  useEffect(() => {
    setUserScrolled(false)
    setLocalMessages([])
    resetGeneration() // Reset document generation state when switching chats
  }, [chatId, resetGeneration])

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

  const handleDocumentGeneration = async (documents: any[], chatId: string) => {
    try {
      let createdCount = 0

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]
        try {
          // Convert markdown content to BlockNote format
          const blocks = await convertMarkdownToBlocks(doc.content)

          // Create document with BlockNote content
          const documentId = await createDocument({
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
        toast.success(`已成功创建 ${createdCount} 个需求文档`)
        // Refresh the chat to show linked documents
        queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
        // Refresh documents list in navigation
        queryClient.invalidateQueries({ queryKey: ['documents'] })
      } else {
        setGenerationError('文档创建失败')
        toast.error('文档创建失败')
      }
    } catch (error) {
      console.error('Failed to handle document generation:', error)
      setGenerationError('文档创建过程中发生错误')
      toast.error('文档创建过程中发生错误')
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
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-semibold">{chat?.title}</h1>
        <div className="flex items-center gap-2">
          {/* Requirement Generator Button */}
          <ChatRequirementIntegration
            onDocumentCreated={() => {
              toast.success('需求文档已生成')
              // Refresh linked documents
              queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
            }}
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <FileText className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Linked documents</h3>
                <ChatDocumentList
                  chatId={chatId}
                  documents={chat?.documents || []}
                  editable={true}
                />
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit title</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDocumentSelector(true)}>
                Manage documents
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea
        className="flex-1 p-4"
        ref={scrollAreaRef}
        onScrollCapture={handleScroll}>
        <div className="space-y-4">
          {localMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}>
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
                    ?.replace(/__GENERATION_PROGRESS__:.*?\n/g, '')
                  }
                </p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {(isTyping || streamingContent) && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-lg bg-muted px-4 py-2">
                {streamingContent ? (
                  <div>
                    <p className="whitespace-pre-wrap">
                      {streamingContent
                        ?.replace(/__DOCUMENTS_GENERATED__:.*?\n/g, '')
                        ?.replace(/__DOCUMENT_GENERATION_START__:.*?\n/g, '')
                        ?.replace(/__GENERATION_PROGRESS__:.*?\n/g, '')
                      }
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
            <div className="flex justify-start">
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
            placeholder="Enter message..."
            className="max-h-[120px] min-h-[40px] resize-none"
            disabled={sendMessageMutation.isPending || isTyping}
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="mb-1"
            disabled={
              !input.trim() || sendMessageMutation.isPending || isTyping
            }>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog
        open={showDocumentSelector}
        onOpenChange={setShowDocumentSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Linked Documents</DialogTitle>
          </DialogHeader>
          <DocumentSelector
            chatId={chatId}
            linkedDocumentIds={chat?.documents?.map((d) => d.id) || []}
            onClose={() => setShowDocumentSelector(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChatPage
