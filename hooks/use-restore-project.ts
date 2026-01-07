'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import apiClient from '@/libs/utils/axios'

export function useRestoreProject(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await apiClient.post(`/api/projects/${projectId}/restore`)
      return response.data
    },
    onSuccess: (restoredProject) => {
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['trash', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] })

      toast.success(`Restored "${restoredProject.title}"`)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to restore project')
    },
  })
}
