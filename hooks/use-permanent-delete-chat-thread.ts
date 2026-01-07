'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import apiClient from '@/libs/utils/axios'

export function usePermanentDeleteChatThread(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (threadId: string) => {
      const response = await apiClient.delete(`/api/chat-threads/${threadId}/permanent`)
      return response.data
    },
    onSuccess: () => {
      // Invalidate trash cache
      queryClient.invalidateQueries({ queryKey: ['trash', workspaceId] })

      toast.success('Chat thread permanently deleted')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete chat thread')
    },
  })
}
