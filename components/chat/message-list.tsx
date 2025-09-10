'use client'

import { UIMessage, ChatStatus } from 'ai'
import { Brain, RefreshCw } from 'lucide-react'
import { useRef, useEffect } from 'react'

import { AssistantMessage } from '@/components/chat/assistant-message'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

import { cn } from '@/lib/utils'

interface MessageListProps {
  messages: UIMessage[]
  status: ChatStatus
  onRetry: () => void
  onSendMessage: (message: { text: string }) => void
}

export function MessageList({ messages, status, onRetry, onSendMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Top blur gradient - avoid scrollbar area */}
      <div className="absolute top-0 left-0 right-4 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />

      {/* Bottom blur gradient - avoid scrollbar area */}
      <div className="absolute bottom-0 left-0 right-4 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

      <ScrollArea className="h-full px-4">
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {messages.filter((m) => m.role !== 'system').length === 0 ? (
            <div className="text-center py-20">
              <Avatar className="h-12 w-12 mx-auto mb-4">
                <AvatarFallback className="bg-muted">
                  <Brain className="h-6 w-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold mb-2">How can I help you today?</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Ask me anything, and I&apos;ll do my best to help you with detailed and accurate responses.
              </p>
            </div>
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
                            <AssistantMessage
                              key={`${message.id}-${i}`}
                              content={part.text}
                              onOptionSelect={(value) => onSendMessage({ text: value })}
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
    </div>
  )
}
