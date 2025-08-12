'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  MessageSquare,
  Archive,
  MoreVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [shouldAutoExpand, setShouldAutoExpand] = useState<string | null>(null)

  const { data: chats, isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: chatApi.getList,
  })

  // Listen for chat updates to auto-expand when new documents are linked
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event?.query?.queryKey?.[0] === 'chat') {
        const chatId = event.query.queryKey[1] as string
        if (chatId) {
          setShouldAutoExpand(chatId)
          // Auto-expand this chat
          setExpanded((prev) => ({ ...prev, [chatId]: true }))
          // Reset auto-expand after a delay
          setTimeout(() => {
            setShouldAutoExpand(null)
          }, 5000)
        }
      }
    })

    return unsubscribe
  }, [queryClient])

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

  const handleDocumentClick = (documentId: string) => {
    router.push(`/documents/${documentId}`)
  }

  const onExpand = (chatId: string) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [chatId]: !prevExpanded[chatId],
    }))
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
          <div key={chat.id}>
            <div
              className={cn(
                'group flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent'
              )}
              onClick={() => handleChatClick(chat)}>
              <div className="flex min-w-0 flex-1 items-center">
                {/* Expand/Collapse button for chats with documents */}
                {chat.documents && chat.documents.length > 0 && (
                  <div
                    role="button"
                    className="mr-1 h-full rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      onExpand(chat.id)
                    }}>
                    {expanded[chat.id] ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                    )}
                  </div>
                )}
                <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {chat.title}
                    {chat.documents && chat.documents.length > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({chat.documents.length})
                      </span>
                    )}
                  </div>
                  {chat.messages?.[0] && (
                    <div className="truncate text-xs text-muted-foreground">
                      {chat.messages[0].content}
                    </div>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}>
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

            {/* Show associated documents when expanded */}
            {expanded[chat.id] &&
              chat.documents &&
              chat.documents.length > 0 && (
                <div className="ml-8 space-y-1 border-l-2 border-muted-foreground/20 pl-2">
                  {chat.documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex cursor-pointer items-center rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDocumentClick(document.id)
                      }}>
                      {document.icon ? (
                        <div className="mr-2 shrink-0 text-[16px]">
                          {document.icon}
                        </div>
                      ) : (
                        <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="truncate">{document.title}</span>
                    </div>
                  ))}
                </div>
              )}
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
