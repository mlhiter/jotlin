'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Paperclip, MoreVertical, FileText } from 'lucide-react'
import { toast } from 'sonner'

import { chatApi } from '@/api/chat'
import { useChatStore } from '@/stores/chat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/libs/utils'
import { ChatDocumentList } from '@/app/(main)/components/chat-document-list'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const ChatPage = () => {
  const params = useParams()
  const chatId = params.chatId as string
  const queryClient = useQueryClient()
  const { setActiveChat, setMessages, addMessage } = useChatStore()

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const { data: chat, isLoading: chatLoading } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => chatApi.getById(chatId),
    enabled: !!chatId,
  })

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => chatApi.getMessages(chatId),
    enabled: !!chatId,
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const userMessage = await chatApi.sendMessage({
        content,
        role: 'user',
        chatId,
      })

      addMessage(userMessage)

      setIsTyping(true)
      const aiResponse = await chatApi.getAIResponse(chatId, content)
      setIsTyping(false)

      return aiResponse
    },
    onSuccess: (aiMessage) => {
      addMessage(aiMessage)
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
    onError: (error) => {
      setIsTyping(false)
      toast.error('send message error')
      console.error('Send message error:', error)
    },
  })

  useEffect(() => {
    if (chat) {
      setActiveChat(chat)
    }
  }, [chat, setActiveChat])

  useEffect(() => {
    if (messages) {
      setMessages(messages)
    }
  }, [messages, setMessages])

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending || isTyping) return

    const content = input.trim()
    setInput('')
    sendMessageMutation.mutate(content)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (chatLoading || messagesLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="ml-auto h-16 w-1/2" />
          <Skeleton className="h-16 w-2/3" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-semibold">{chat?.title}</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <FileText className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Linked documents</h3>
                <ChatDocumentList
                  chatId={chatId}
                  documents={chat?.documents || []}
                  editable={true}
                />
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit title</DropdownMenuItem>
              <DropdownMenuItem>Manage documents</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages?.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}>
              <div
                className={cn(
                  'max-w-[70%] rounded-lg px-4 py-2',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-4 py-2">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 delay-100" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500 delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="mb-1">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter message..."
            className="max-h-[120px] min-h-[40px] resize-none"
            disabled={sendMessageMutation.isPending || isTyping}
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="mb-1"
            disabled={
              !input.trim() || sendMessageMutation.isPending || isTyping
            }>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
