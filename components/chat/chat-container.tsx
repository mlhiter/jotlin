'use client'

import { useChat } from '@ai-sdk/react'
import { Sparkles, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

import { ChatInput } from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/message-list'
import { RequirementSidebar } from '@/components/chat/requirement-sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

import { parseAIResponse } from '@/lib/xml-parser'

export function ChatContainer() {
  const { messages, sendMessage, status, regenerate, stop, setMessages } = useChat()
  const { theme, setTheme } = useTheme()
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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between py-3 px-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4" />
          <h1 className="text-lg font-semibold">Jotlin Agent</h1>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 p-0">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </header>

      {/* Content Area - Split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Panel */}
        <div className={`flex flex-col overflow-hidden ${showRequirementSidebar ? 'w-5/9' : 'w-full'}`}>
          {/* Messages Container */}
          <MessageList messages={filteredMessages} status={status} onRetry={regenerate} onSendMessage={sendMessage} />

          {/* Fixed Input Form */}
          <ChatInput onSendMessage={sendMessage} onStop={handleStop} status={status} />
        </div>

        {/* Requirement Sidebar */}
        {showRequirementSidebar && (
          <RequirementSidebar
            draft={requirementContent.draft}
            final={requirementContent.final}
            onClose={() => setShowRequirementSidebar(false)}
          />
        )}
      </div>
    </div>
  )
}
