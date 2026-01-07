'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import apiClient from '@/libs/utils/axios'

export function usePermanentDeleteDocument(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiClient.delete(`/api/documents/${documentId}/permanent`)
      return response.data
    },
    onSuccess: () => {
      // Invalidate trash cache
      queryClient.invalidateQueries({ queryKey: ['trash', workspaceId] })

      toast.success('Document permanently deleted')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete document')
    },
  })
}
