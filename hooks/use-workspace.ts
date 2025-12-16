'use client'

import { useQuery } from '@tanstack/react-query'

import apiClient from '@/libs/utils/axios'

interface Workspace {
  id: string
  userId: string
  title: string
  icon: string | null
  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

export function useWorkspace() {
  const fetchWorkspaceRequest = async (): Promise<Workspace> => {
    const response = await apiClient.get('/api/workspaces')
    return response.data
  }

  const {
    data: workspace,
    isPending,
    error,
    refetch: fetchWorkspace,
  } = useQuery({
    queryKey: ['workspace'],
    queryFn: fetchWorkspaceRequest,
  })

  return {
    workspace,
    isLoading: isPending,
    error: error?.message || null,
    fetchWorkspace,
  }
}
