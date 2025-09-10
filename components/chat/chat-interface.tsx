'use client'

import { useChat } from '@ai-sdk/react'
import { Send, User, Bot, Sparkles, Moon, Sun, Copy, Check, RefreshCw } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useRef, useEffect } from 'react'

import { Markdown } from '@/components/chat/markdown'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'

import { cn } from '@/lib/utils'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, status, regenerate } = useChat()
  const { theme, setTheme } = useTheme()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const copyMessage = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 200 // max height in pixels
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between py-3 px-6 border-b bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-semibold">Jotlin AI</h1>
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

      {/* Messages Container */}
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {messages.length === 0 ? (
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
            messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex gap-4 group', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <Card
                  className={cn(
                    'max-w-[85%] p-4 relative',
                    message.role === 'user' ? 'bg-primary text-primary-foreground ml-12' : 'bg-muted mr-12'
                  )}>
                  {message.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const content = message.parts
                          .filter((part) => part.type === 'text')
                          .map((part) => part.text)
                          .join('')
                        copyMessage(content, message.id)
                      }}>
                      {copiedMessageId === message.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}

                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return message.role === 'user' ? (
                          <p key={`${message.id}-${i}`} className="whitespace-pre-wrap text-sm leading-relaxed">
                            {part.text}
                          </p>
                        ) : (
                          <Markdown key={`${message.id}-${i}`} content={part.text} className="text-sm" />
                        )
                    }
                  })}
                </Card>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-muted-foreground text-background">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}

          {(status === 'submitted' || status === 'streaming') && (
            <div className="flex gap-4 justify-start">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-muted mr-12 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">
                    {status === 'submitted' ? 'Sending...' : 'AI is responding...'}
                  </span>
                </div>
              </Card>
            </div>
          )}

          {status === 'error' && (
            <div className="flex gap-4 justify-start">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-red-500 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 mr-12 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600 dark:text-red-400">❌ Failed to get response</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => regenerate()}
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
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

      {/* Input Form */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Jotlin AI..."
                disabled={status === 'submitted' || status === 'streaming'}
                className="min-h-[44px] max-h-[200px] resize-none pr-12 py-3"
                rows={1}
              />
              <Button
                type="submit"
                disabled={!input.trim() || status === 'submitted' || status === 'streaming'}
                size="sm"
                className="absolute right-2 bottom-2 h-8 w-8 p-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
            <div className="flex items-center gap-2">
              {status === 'error' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => regenerate()}
                    className="h-6 px-2 text-xs text-red-500 hover:text-red-600">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                  <span className="text-xs text-red-500">Request failed</span>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
