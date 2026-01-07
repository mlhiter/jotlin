'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import apiClient from '@/libs/utils/axios'

export function useRestoreDocument(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiClient.post(`/api/documents/${documentId}/restore`)
      return response.data
    },
    onSuccess: (restoredDocument) => {
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['trash', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['documents', workspaceId] })

      toast.success(`Restored "${restoredDocument.title}"`)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Failed to restore document'
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
