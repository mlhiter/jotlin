'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import apiClient from '@/libs/utils/axios'

export function usePermanentDeleteProject(workspaceId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await apiClient.delete(`/api/projects/${projectId}/permanent`)
      return response.data
    },
    onSuccess: () => {
      // Invalidate trash cache
      queryClient.invalidateQueries({ queryKey: ['trash', workspaceId] })

      toast.success('Project permanently deleted')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete project')
    },
  })
}
