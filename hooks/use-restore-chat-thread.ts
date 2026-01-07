'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import apiClient from '@/libs/utils/axios'

export function useRestoreChatThread(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (threadId: string) => {
      const response = await apiClient.post(`/api/chat-threads/${threadId}/restore`)
      return response.data
    },
    onSuccess: (restoredThread) => {
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['trash', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['chatThreads'] })

      toast.success(`Restored chat thread`)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Failed to restore chat thread'
      const errorDetails = error?.response?.data?.details

      if (errorDetails) {
        toast.error(errorMessage, {
          description: errorDetails,
        })
      } else {
        toast.error(errorMessage)
      }
    },
  })
}
