'use client'

import { useChat } from '@ai-sdk/react'
import { Sparkles, Moon, Sun, RefreshCw, ArrowUp, Brain, Square } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useRef, useEffect } from 'react'

import { AIResponse } from '@/components/chat/ai-response'
import { RequirementPanel } from '@/components/chat/requirement-panel'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'

import { cn } from '@/lib/utils'
import { parseAIResponse } from '@/lib/xml-parser'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, status, regenerate, stop, setMessages } = useChat()
  const { theme, setTheme } = useTheme()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showRequirementPanel, setShowRequirementPanel] = useState(false)

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

  // Auto show/hide requirement panel
  useEffect(() => {
    if (requirementContent.draft || requirementContent.final) {
      setShowRequirementPanel(true)
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [filteredMessages])

  useEffect(() => {
    if (status === 'error') {
      setTimeout(() => cleanupEmptyAssistantMessage(), 100)
    }
  }, [status])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status === 'submitted' || status === 'streaming') return

    sendMessage({ text: input })
    setInput('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleStop = () => {
    stop()
    // clear empty assistant message
    setTimeout(() => cleanupEmptyAssistantMessage(), 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 200
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between py-3 px-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
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
        <div className={`flex flex-col overflow-hidden ${showRequirementPanel ? 'w-5/9' : 'w-full'}`}>
          {/* Messages Container */}
          <ScrollArea className="flex-1 px-4 h-0">
            <div className="max-w-3xl mx-auto py-6 space-y-6">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-20">
                  <Avatar className="h-12 w-12 mx-auto mb-4">
                    <AvatarFallback className="bg-muted">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Ask me anything, and I&apos;ll do my best to help you with detailed and accurate responses.
                  </p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn('flex gap-4 group', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <Card
                      className={cn(
                        'max-w-[85%] p-2.5 relative shadow-none border-none bg-background',
                        message.role === 'user' ? ' text-gray-900 ml-12 bg-neutral-200' : 'mr-12'
                      )}>
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text':
                            return message.role === 'user' ? (
                              <p key={`${message.id}-${i}`} className="whitespace-pre-wrap text-sm leading-relaxed">
                                {part.text}
                              </p>
                            ) : (
                              <AIResponse
                                key={`${message.id}-${i}`}
                                content={part.text}
                                onOptionSelect={(value) => sendMessage({ text: value })}
                              />
                            )
                        }
                      })}
                    </Card>
                  </div>
                ))
              )}

              {(status === 'submitted' || status === 'streaming') && (
                <div className="flex gap-4 justify-start">
                  <div className="flex items-center gap-2 animate-pulse">
                    <Brain className="h-4 w-4 text-muted-foreground " />
                    <span className="text-xs text-muted-foreground">{'Thinking...'}</span>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="flex gap-4 justify-start">
                  <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 mr-12 p-2.5 shadow-none">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-600 dark:text-red-400">Failed to get response</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => regenerate()}
                        className="h-7 px-2 text-xs text-red-600  dark:text-red-400 hover:bg-transparent hover:text-red-600">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Fixed Input Form */}
          <div className="px-4 mb-2">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="relative flex items-end gap-3">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message Jotlin Agent..."
                    disabled={status === 'submitted' || status === 'streaming'}
                    className="max-h-[200px] resize-none pr-12 py-3"
                    rows={1}
                  />
                  <Button
                    type={status === 'streaming' ? 'button' : 'submit'}
                    onClick={status === 'streaming' ? handleStop : undefined}
                    disabled={status !== 'streaming' && !input.trim()}
                    size="sm"
                    className="absolute right-2 bottom-2 h-8 w-8 p-0">
                    {status === 'streaming' ? <Square className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
                <p className="text-xs text-muted-foreground">Powered by Gemini-2.5-flash</p>
              </div>
            </form>
          </div>
        </div>

        {/* Requirement Panel */}
        {showRequirementPanel && (
          <RequirementPanel
            draft={requirementContent.draft}
            final={requirementContent.final}
            onClose={() => setShowRequirementPanel(false)}
          />
        )}
      </div>
    </div>
  )
}
