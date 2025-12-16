'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/libs/utils/axios'

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

export function useChats() {
  const queryClient = useQueryClient()

  const fetchChatsRequest = async (): Promise<Chat[]> => {
    const response = await apiClient.get('/api/chats')
    return response.data
  }

  const createChatRequest = async (title?: string): Promise<Chat> => {
    const response = await apiClient.post('/api/chats', { title })
    return response.data
  }

  const deleteChatRequest = async (chatId: string): Promise<void> => {
    await apiClient.delete(`/api/chats/${chatId}`)
  }

  const {
    data: chats = [],
    isPending,
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
    isLoading: isPending,
    error: error?.message || null,
    fetchChats,
    createChat: createChatMutation.mutateAsync,
    deleteChat: deleteChatMutation.mutateAsync,
    isCreating: createChatMutation.isPending,
    isDeleting: deleteChatMutation.isPending,
  }
}
