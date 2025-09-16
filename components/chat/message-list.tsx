'use client'

import { ChatStatus } from 'ai'
import { Brain, RefreshCw, ChevronDown } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

import { AssistantMessage } from '@/components/chat/assistant-message'
import { EmptyState } from '@/components/chat/empty-state'
import { UserMessage } from '@/components/chat/user-message'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

import { cn } from '@/lib/utils'
import { MyUIMessage } from '@/schema/chat'

interface MessageListProps {
  messages: MyUIMessage[]
  status: ChatStatus
  onRetry: () => void
  onSendMessage: (message: { text: string }) => void
  onUpdateMessage?: (messageId: string, metadata: MyUIMessage['metadata']) => void
}

export function MessageList({ messages, status, onRetry, onSendMessage, onUpdateMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleScroll = () => {
    if (!scrollAreaRef.current) return

    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollContainer) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100 // 100px threshold

    setShowScrollButton(!isAtBottom)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollContainer) return

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Top blur gradient - avoid scrollbar area */}
      <div className="absolute top-0 left-0 right-4 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />

      {/* Bottom blur gradient - avoid scrollbar area */}
      <div className="absolute bottom-0 left-0 right-4 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

      <ScrollArea ref={scrollAreaRef} className="h-full px-4">
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {messages.filter((m) => m.role !== 'system').length === 0 ? (
            <EmptyState onSendMessage={onSendMessage} />
          ) : (
            messages
              .filter((m) => m.role !== 'system')
              .map((message) => (
                <div
                  key={message.id}
                  className={cn('flex gap-4 group', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <Card
                    className={cn(
                      'max-w-[85%] p-2.5 relative shadow-none border-none bg-background',
                      message.role === 'user' ? 'ml-12 bg-muted text-foreground' : 'mr-12'
                    )}>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'text':
                          return message.role === 'user' ? (
                            <UserMessage key={`${message.id}-${i}`} content={part.text} />
                          ) : (
                            <AssistantMessage
                              key={`${message.id}-${i}`}
                              content={part.text}
                              messageId={message.id}
                              metadata={message.metadata}
                              onOptionSelect={(value) => onSendMessage({ text: value })}
                              onUpdateMetadata={(metadata) => onUpdateMessage?.(message.id, metadata)}
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
                    onClick={onRetry}
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

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <Button
            onClick={scrollToBottom}
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-full shadow-lg border bg-background hover:bg-muted">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
