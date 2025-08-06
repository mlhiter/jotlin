'use client'

import { useRouter } from 'next/navigation'
import {
  Plus,
  MessageSquare,
  Archive,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { cn } from '@/libs/utils'
import { chatApi } from '@/api/chat'
import { useChatStore } from '@/stores/chat'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChatListProps {
  parentId?: string
}

export const ChatList = ({}: ChatListProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setActiveChat } = useChatStore()

  const { data: chats, isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: chatApi.getList,
  })

  const createMutation = useMutation({
    mutationFn: chatApi.create,
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      router.push(`/chats/${newChat.id}`)
    },
  })

  const archiveMutation = useMutation({
    mutationFn: chatApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: chatApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })

  const handleCreate = () => {
    createMutation.mutate({
      title: 'New chat',
      description: '',
    })
  }

  const handleChatClick = (chat: any) => {
    setActiveChat(chat)
    router.push(`/chats/${chat.id}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  const activeChats = chats?.filter((chat) => !chat.isArchived) || []
  const archivedChats = chats?.filter((chat) => chat.isArchived) || []

  return (
    <div className="flex flex-col space-y-2 p-2">
      <Button
        onClick={handleCreate}
        className="w-full justify-start"
        variant="ghost"
        size="sm"
        disabled={createMutation.isPending}>
        <Plus className="mr-2 h-4 w-4" />
        New chat
      </Button>

      <div className="space-y-1">
        {activeChats.map((chat) => (
          <div
            key={chat.id}
            className={cn(
              'group flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent'
            )}
            onClick={() => handleChatClick(chat)}>
            <div className="flex min-w-0 flex-1 items-center">
              <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{chat.title}</div>
                {chat.messages?.[0] && (
                  <div className="truncate text-xs text-muted-foreground">
                    {chat.messages[0].content}
                  </div>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    archiveMutation.mutate(chat.id)
                  }}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteMutation.mutate(chat.id)
                  }}
                  className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {archivedChats.length > 0 && (
        <>
          <div className="px-2 pt-4 text-xs text-muted-foreground">
            Archived
          </div>
          <div className="space-y-1">
            {archivedChats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  'group flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm opacity-60 hover:bg-accent'
                )}
                onClick={() => handleChatClick(chat)}>
                <div className="flex min-w-0 flex-1 items-center">
                  <Archive className="mr-2 h-4 w-4 flex-shrink-0" />
                  <div className="truncate">{chat.title}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
