'use client'

import { Bot, User } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/libs/utils'
import { Message } from '@/types/chat'

interface MessageItemProps {
  message: Message
  user: any
  isTyping?: boolean
}

// Helper function to get user initials
const getInitials = (name: string | null, email: string) => {
  if (name && name.trim()) {
    return name
      .trim()
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email.slice(0, 2).toUpperCase()
}

// Helper function to clean message content from signals
const cleanMessageContent = (content: string) => {
  return content
    ?.replace(/__DOCUMENTS_GENERATED__:.*?\n/g, '')
    ?.replace(/__DOCUMENT_GENERATION_START__:.*?\n/g, '')
    ?.replace(/__GENERATION_PROGRESS__:.*?\n/g, '')
}

export const MessageItem = ({ message, user, isTyping = false }: MessageItemProps) => {
  const messageUser = message.role === 'user' && message.user ? message.user : user
  const displayName = messageUser?.name || messageUser?.email || 'Unknown User'
  const isUserMessage = message.role === 'user'

  return (
    <div className={cn('flex items-start gap-3', isUserMessage ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn('flex flex-col items-center gap-1', isUserMessage ? 'items-end' : 'items-start')}>
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          {isUserMessage ? (
            <>
              <AvatarImage src={messageUser?.image || undefined} />
              <AvatarFallback className="bg-blue-500 text-xs font-medium text-white">
                {messageUser?.email ? getInitials(messageUser.name, messageUser.email) : <User className="h-4 w-4" />}
              </AvatarFallback>
            </>
          ) : (
            <AvatarFallback className="bg-primary">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </AvatarFallback>
          )}
        </Avatar>

        {/* User Name */}
        <span className="max-w-20 truncate text-xs text-muted-foreground">
          {isUserMessage ? displayName : 'AI助手'}
        </span>
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          isUserMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
        <p className="whitespace-pre-wrap">{cleanMessageContent(message.content)}</p>
        <p className="mt-1 text-xs opacity-70">{new Date(message.createdAt).toLocaleTimeString()}</p>
      </div>
    </div>
  )
}
