'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Chat {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  userId: string
  messages: Array<{
    id: string
    content: string
    role: string
    createdAt: string
  }>
  _count: {
    messages: number
  }
}

const fetchChatsRequest = async (): Promise<Chat[]> => {
  const response = await fetch('/api/chats')
  if (!response.ok) {
    throw new Error('Failed to fetch chats')
  }
  return response.json()
}

const createChatRequest = async (title?: string): Promise<Chat> => {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  })

  if (!response.ok) {
    throw new Error('Failed to create chat')
  }
  return response.json()
}

const deleteChatRequest = async (chatId: string): Promise<void> => {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete chat')
  }
}

export function useChats() {
  const queryClient = useQueryClient()

  const {
    data: chats = [],
    isLoading,
    error,
    refetch: fetchChats,
  } = useQuery({
    queryKey: ['chats'],
    queryFn: fetchChatsRequest,
  })

  const createChatMutation = useMutation({
    mutationFn: createChatRequest,
    onSuccess: (newChat) => {
      queryClient.setQueryData(['chats'], (old: Chat[] = []) => [newChat, ...old])
    },
  })

  const deleteChatMutation = useMutation({
    mutationFn: deleteChatRequest,
    onSuccess: (_, chatId) => {
      queryClient.setQueryData(['chats'], (old: Chat[] = []) => old.filter((chat) => chat.id !== chatId))
    },
  })

  return {
    chats,
    isLoading,
    error: error?.message || null,
    fetchChats,
    createChat: createChatMutation.mutateAsync,
    deleteChat: deleteChatMutation.mutateAsync,
    isCreating: createChatMutation.isPending,
    isDeleting: deleteChatMutation.isPending,
  }
}
