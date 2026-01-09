'use client'

import { ChatStatus } from 'ai'
import { Brain, RefreshCw, ChevronDown } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

import { AssistantMessage } from '@/components/chat/assistant-message'
import { EmptyState } from '@/components/chat/empty-state'
import { ToolCallCard } from '@/components/chat/tool-call-card'
import { UserMessage } from '@/components/chat/user-message'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

import { cn } from '@/libs/utils/utils'
import { MyUIMessage } from '@/schema/chat'

import type { MessagePart } from '@/types/chat'

interface MessageListProps {
  messages: MyUIMessage[]
  status: ChatStatus
  isLoading?: boolean
  onRetry: () => void
  onSendMessage: (message: { text: string }) => void
  onUpdateMessage?: (messageId: string, metadata: MyUIMessage['metadata']) => void
  onRollback: (messageId: string) => void
  messageRefs?: React.RefObject<Map<string, HTMLElement>>
  workspaceId?: string
  projectId?: string
}

// Loading skeleton component
function MessageLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="flex justify-end">
            <Skeleton className="h-16 w-2/3 rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-24 w-3/4 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MessageList({
  messages,
  status,
  isLoading = false,
  onRetry,
  onSendMessage,
  onUpdateMessage,
  onRollback,
  messageRefs,
  workspaceId,
  projectId,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    if (shouldAutoScroll) {
      scrollToBottom()
    }
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
        {isLoading ? (
          <MessageLoadingSkeleton />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 py-6">
            {messages.filter((m) => m.role !== 'system').length === 0 ? (
              <EmptyState onSendMessage={onSendMessage} />
            ) : (
            messages
              .filter((m) => m.role !== 'system')
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
                  ) : message.role === 'assistant' ? (
                    <div className="flex-1 space-y-2">
                      {(() => {
                        // Check if there are any executing tool calls
                        const hasExecutingTools = message.parts.some(
                          (part: any) =>
                            part.type?.startsWith('tool-') &&
                            part.state !== 'output-available' &&
                            part.state !== 'output-error'
                        )

                        // Check if message has any tool calls (executing or completed)
                        const hasToolCalls = message.parts.some((part: any) => part.type?.startsWith('tool-'))

                        return message.parts
                          .map((part: any, i) => {
                            // Skip text parts if there are executing tools
                            if (part.type === 'text') {
                              // Don't render text when tools are executing
                              if (hasExecutingTools) {
                                return null
                              }

                              return (
                                <AssistantMessage
                                  key={`${message.id}-${i}`}
                                  content={part.text}
                                  messageId={message.id}
                                  metadata={message.metadata}
                                  onOptionSelect={(value) => onSendMessage({ text: value })}
                                  onUpdateMetadata={(metadata) => onUpdateMessage?.(message.id, metadata)}
                                  onRollback={() => onRollback(message.id)}
                                  // Hide rollback button if message has tool calls
                                  showRollback={!hasToolCalls}
                                />
                              )
                            }

                            // Render tool calls - only for tools that show UI
                            if (part.type?.startsWith('tool-')) {
                              const toolName = part.type.replace('tool-', '')
                              const isExecuting =
                                part.state !== 'output-available' && part.state !== 'output-error'

                              // Only render create/update tools, or tools that are currently executing
                              const shouldRender =
                                isExecuting || toolName === 'create_document' || toolName === 'update_document'

                              if (!shouldRender) {
                                return null
                              }

                              return (
                                <ToolCallCard
                                  key={part.toolCallId}
                                  toolName={toolName}
                                  toolCallId={part.toolCallId}
                                  args={part.input}
                                  result={part.output}
                                  isExecuting={isExecuting}
                                  defaultCollapsed={message.metadata?.isCollapsed ?? true}
                                  workspaceId={workspaceId}
                                  projectId={projectId}
                                />
                              )
                            }

                            return null
                          })
                          .filter(Boolean)
                      })()}{/* Filter out null values to avoid empty space */}
                    </div>
                  ) : null}
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
        )}
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 transform">
          <Button
            onClick={scrollToBottom}
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
