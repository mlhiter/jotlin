'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useEffect } from 'react'

import { ChatInput } from '@/components/chat/chat-input'
import { DraftPanel } from '@/components/chat/draft-panel'
import { MessageList } from '@/components/chat/message-list'
import { PageHeader } from '@/components/page-header'

import { cn } from '@/lib/utils'
import { parseAIResponse } from '@/lib/xml-parser'

export default function ChatPage() {
  const { messages, sendMessage, status, regenerate, stop, setMessages } = useChat()
  const [showRequirementSidebar, setShowRequirementSidebar] = useState(false)

  // filter empty assistant messages
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
    // clear empty assistant message
    setTimeout(() => cleanupEmptyAssistantMessage(), 100)
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
            <MessageList messages={filteredMessages} status={status} onRetry={regenerate} onSendMessage={sendMessage} />

            <ChatInput onSendMessage={sendMessage} onStop={handleStop} status={status} />
          </div>

          <div className="absolute top-0 right-0 h-full">
            <DraftPanel
              draft={'testsetestset'}
              final={requirementContent.final}
              isVisible={showRequirementSidebar}
              onToggle={() => setShowRequirementSidebar(!showRequirementSidebar)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
