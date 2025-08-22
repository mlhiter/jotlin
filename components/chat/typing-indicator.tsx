'use client'

import { Bot } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface TypingIndicatorProps {
  streamingContent?: string
}

// Helper function to clean streaming content from signals
const cleanStreamingContent = (content: string) => {
  return content
    ?.replace(/__DOCUMENTS_GENERATED__:.*?\n/g, '')
    ?.replace(/__DOCUMENT_GENERATION_START__:.*?\n/g, '')
    ?.replace(/__GENERATION_PROGRESS__:.*?\n/g, '')
}

export const TypingIndicator = ({ streamingContent }: TypingIndicatorProps) => {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-start gap-1">
        {/* AI Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </AvatarFallback>
        </Avatar>

        {/* AI Name */}
        <span className="max-w-20 truncate text-xs text-muted-foreground">AI助手</span>
      </div>

      {/* AI Message Content */}
      <div className="max-w-[70%] rounded-lg bg-muted px-4 py-2">
        {streamingContent ? (
          <div>
            <p className="whitespace-pre-wrap">{cleanStreamingContent(streamingContent)}</p>
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
  )
}
