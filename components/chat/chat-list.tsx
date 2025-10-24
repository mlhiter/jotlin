'use client'

import { MessageSquare, MoreHorizontal, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'

import { useChats } from '@/hooks/use-chat'

export function ChatList() {
  const { chats, isLoading, deleteChat } = useChats()
  const pathname = usePathname()
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { isMobile } = useSidebar()

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (deletingId) return

    const isCurrentChat = pathname === `/chat/${chatId}`

    try {
      setDeletingId(chatId)
      await deleteChat(chatId)

      if (isCurrentChat) {
        router.push('/chat')
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
      toast.error('Failed to delete chat')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted/50" />
        ))}
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No chats yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Start a conversation to see your chat history</p>
      </div>
    )
  }

  return (
    <SidebarMenu>
      {chats.map((chat) => {
        const isActive = pathname === `/chat/${chat.id}`
        const displayTitle = chat.title || 'New Chat'
        return (
          <SidebarMenuItem key={chat.id}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link href={`/chat/${chat.id}`}>
                <span className="truncate">{displayTitle}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction onClick={(e) => e.preventDefault()}>
                  <MoreHorizontal className="h-3 w-3" />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? 'bottom' : 'right'}
                align={isMobile ? 'end' : 'start'}>
                <DropdownMenuItem onClick={(e) => handleDelete(chat.id, e)}>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
