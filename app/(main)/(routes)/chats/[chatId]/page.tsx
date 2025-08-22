'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { ChatHeader } from '@/components/chat/chat-header'
import { ChatInput } from '@/components/chat/chat-input'
import { DocumentGenerationWrapper } from '@/components/chat/document-generation-wrapper'
import { MessageItem } from '@/components/chat/message-item'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

import { useChatState } from '@/hooks/use-chat-state'
import { useDocumentGenerationHandler } from '@/hooks/use-document-generation-handler'
import { useSession } from '@/hooks/use-session'
import { config, logger } from '@/libs/config'

const ChatPage = () => {
  const params = useParams()
  const chatId = params.chatId as string
  const { user } = useSession()

  // Use the new chat state hook
  const {
    chat,
    messages,
    localMessages,
    chatLoading,
    messagesLoading,
    isTyping,
    input,
    setInput,
    streamingContent,
    requirementSubmitted,
    setRequirementSubmitted,
    userScrolled,
    messagesEndRef,
    scrollAreaRef,
    handleSend,
    handleKeyDown,
    handleRequirementSubmitted,
    handleScroll,
    scrollToBottom,
    sendMessageMutation,
    setSignalCallbacks,
  } = useChatState(chatId)

  // Use the document generation handler
  const {
    documentGenerationState,
    resetGeneration,
    forceComplete,
    handleProgressUpdate,
    handleGenerationStart,
    handleDocumentsGenerated,
  } = useDocumentGenerationHandler()

  // Set up signal processing callbacks
  useEffect(() => {
    setSignalCallbacks({
      onProgressUpdate: handleProgressUpdate,
      onGenerationStart: handleGenerationStart,
      onDocumentsGenerated: handleDocumentsGenerated,
    })
  }, [setSignalCallbacks, handleProgressUpdate, handleGenerationStart, handleDocumentsGenerated])

  // Global timeout protection for document generation
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (documentGenerationState.isGenerating && documentGenerationState.documents.length > 0) {
      timeoutId = setTimeout(() => {
        logger.warn('Document generation global timeout detected, forcing completion')
        forceComplete()
        toast.error('文档生成超时，已强制完成')
      }, config.timeouts.documentGeneration)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [documentGenerationState.isGenerating, documentGenerationState.documents.length, forceComplete])

  // Error recovery mechanism
  useEffect(() => {
    if (documentGenerationState.error) {
      const timer = setTimeout(() => {
        resetGeneration()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [documentGenerationState.error, resetGeneration])

  // Reset states when switching chats
  useEffect(() => {
    setRequirementSubmitted(false)
    resetGeneration()
  }, [chatId, resetGeneration, setRequirementSubmitted])

  // Loading state
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

  const isInputDisabled = !requirementSubmitted || sendMessageMutation.isPending || isTyping

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <ChatHeader
        chat={chat}
        chatId={chatId}
        chatLoading={chatLoading}
        requirementSubmitted={requirementSubmitted}
        onRequirementSubmitted={handleRequirementSubmitted}
      />

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef} onScrollCapture={handleScroll}>
        <div className="space-y-4">
          {/* Regular messages */}
          {localMessages.map((message) => (
            <MessageItem key={message.id} message={message} user={user} />
          ))}

          {/* Typing indicator */}
          {(isTyping || streamingContent) && <TypingIndicator streamingContent={streamingContent} />}

          {/* Document generation progress */}
          <DocumentGenerationWrapper documentGenerationState={documentGenerationState} />

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        input={input}
        setInput={setInput}
        requirementSubmitted={requirementSubmitted}
        isDisabled={isInputDisabled}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

export default ChatPage
