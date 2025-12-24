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

import { cn } from '@/libs/utils/utils'
import { MyUIMessage } from '@/schema/chat'

import type { MessagePart } from '@/types/chat'

interface MessageListProps {
  messages: MyUIMessage[]
  status: ChatStatus
  onRetry: () => void
  onSendMessage: (message: { text: string }) => void
  onUpdateMessage?: (messageId: string, metadata: MyUIMessage['metadata']) => void
  onRollback: (messageId: string) => void
  messageRefs?: React.MutableRefObject<Map<string, HTMLElement>>
}

export function MessageList({
  messages,
  status,
  onRetry,
  onSendMessage,
  onUpdateMessage,
  onRollback,
  messageRefs,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const prevMessagesLength = useRef(0)

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' })
  }

  const handleScroll = () => {
    if (!scrollAreaRef.current) return

    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollContainer) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100

    setShowScrollButton(!isAtBottom)
    setShouldAutoScroll(isAtBottom)
  }

  useEffect(() => {
    // Force scroll to bottom when messages are bulk loaded (e.g., after document generation)
    const currentLength = messages.length
    const prevLength = prevMessagesLength.current

    // If messages increased significantly (3+ new messages), likely a bulk load, force scroll
    const isBulkLoad = currentLength - prevLength >= 3

    if (shouldAutoScroll || isBulkLoad) {
      // Use setTimeout to ensure DOM is updated before scrolling
      // Increased delay for bulk loads to ensure DOM is fully rendered
      setTimeout(() => {
        scrollToBottom(isBulkLoad)
        if (isBulkLoad) {
          setShouldAutoScroll(true)
        }
      }, isBulkLoad ? 300 : 100)
    }

    prevMessagesLength.current = currentLength
  }, [messages, shouldAutoScroll])

  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollContainer) return

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Top blur gradient */}
      <div className="from-background pointer-events-none absolute left-0 right-3 top-0 z-10 h-8 bg-gradient-to-b to-transparent" />

      {/* Bottom blur gradient */}
      <div className="from-background pointer-events-none absolute bottom-0 left-0 right-3 z-10 h-8 bg-gradient-to-t to-transparent" />

      <ScrollArea ref={scrollAreaRef} className="h-full px-4">
        <div className="mx-auto max-w-3xl space-y-6 pb-4 pt-6">
          {messages.filter((m) => m.role !== 'system').length === 0 ? (
            <EmptyState onSendMessage={onSendMessage} />
          ) : (
            messages
              .filter((m) => {
                // Filter out system messages
                if (m.role === 'system') return false

                // For assistant messages, only keep those with non-empty text content
                if (m.role === 'assistant') {
                  return m.parts.some((part) => {
                    if (part.type === 'text') {
                      const text = 'text' in part ? part.text : undefined
                      return text && text.trim().length > 0
                    }
                    return false
                  })
                }

                return true
              })
              .map((message) => (
                <div
                  key={message.id}
                  ref={(el) => {
                    if (el && messageRefs) {
                      messageRefs.current.set(message.id, el)
                    }
                  }}
                  className={cn(
                    'group flex gap-4 transition-colors',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}>
                  {message.role === 'user' ? (
                    <UserMessage
                      key={message.id}
                      parts={message.parts as MessagePart[]}
                      onRollback={() => onRollback(message.id)}
                    />
                  ) : (
                    message.parts
                      .filter((part) => part.type === 'text' && part.text && part.text.trim().length > 0)
                      .map((part, i) => {
                        // Type guard: we've already filtered for type === 'text'
                        const textContent = part.type === 'text' ? part.text : ''
                        return (
                          <AssistantMessage
                            key={`${message.id}-${i}`}
                            content={textContent || ''}
                            messageId={message.id}
                            metadata={message.metadata}
                            onOptionSelect={(value) => onSendMessage({ text: value })}
                            onUpdateMetadata={(metadata) => onUpdateMessage?.(message.id, metadata)}
                            onRollback={() => onRollback(message.id)}
                          />
                        )
                      })
                  )}
                </div>
              ))
          )}

          {(status === 'submitted' || status === 'streaming') && (
            <div className="flex justify-start gap-4">
              <div className="flex animate-pulse items-center gap-2">
                <Brain className="text-muted-foreground h-4 w-4" strokeWidth={1.5} />
                <span className="text-muted-foreground text-xs">{'Thinking...'}</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex justify-start gap-4">
              <Card className="border-border/40 bg-muted/20 mr-12 p-2.5 shadow-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Failed to get response</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                    className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs transition-all duration-150">
                    <RefreshCw className="mr-1 h-3.5 w-3.5" strokeWidth={1.5} />
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
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 transform">
          <Button
            onClick={() => scrollToBottom()}
            size="sm"
            variant="secondary"
            className="bg-background/95 hover:bg-accent border-border/40 h-8 w-8 rounded-full border p-0 shadow-sm backdrop-blur-sm transition-all duration-150">
            <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      )}
    </div>
  )
}
