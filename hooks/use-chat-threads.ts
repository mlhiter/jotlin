import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/libs/utils/axios'

interface ChatThread {
  id: string
  projectId: string | null
  documentId: string | null
  title: string | null
  type: 'PROJECT' | 'DOCUMENT'
  order: number
  createdAt: Date
  updatedAt: Date
  messageCount: number
  lastMessageAt: Date
}

interface UseChatThreadsOptions {
  projectId?: string
  documentId?: string
}

export function useChatThreads({ projectId, documentId }: UseChatThreadsOptions) {
  return useQuery({
    queryKey: ['chatThreads', projectId, documentId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (projectId) params.set('projectId', projectId)
      if (documentId) params.set('documentId', documentId)

      const response = await apiClient.get('/api/chat-threads', { params })
      return response.data.threads as ChatThread[]
    },
    enabled: !!(projectId || documentId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

interface CreateChatThreadData {
  projectId?: string
  documentId?: string
  workspaceId: string
  title?: string
}

export function useCreateChatThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateChatThreadData) => {
      const response = await apiClient.post('/api/chat-threads', data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['chatThreads', variables.projectId, variables.documentId],
      })
    },
  })
}

interface RenameChatThreadData {
  threadId: string
  title: string
}

export function useRenameChatThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ threadId, title }: RenameChatThreadData) => {
      const response = await apiClient.patch(`/api/chat-threads/${threadId}`, { title })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatThreads'] })
    },
  })
}

export function useDeleteChatThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (threadId: string) => {
      await apiClient.delete(`/api/chat-threads/${threadId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatThreads'] })
    },
  })
}
