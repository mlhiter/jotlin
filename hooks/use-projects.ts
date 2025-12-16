'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/libs/utils/axios'

interface Project {
  id: string
  workspaceId: string
  title: string
  icon: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  order: number
  _count: {
    documents: number
    chatThreads: number
  }
}

interface CreateProjectInput {
  workspaceId: string
  title: string
  icon?: string
  description?: string
}

export function useProjects(workspaceId?: string) {
  const queryClient = useQueryClient()

  const fetchProjectsRequest = async (): Promise<Project[]> => {
    if (!workspaceId) return []
    const response = await apiClient.get(`/api/projects?workspaceId=${workspaceId}`)
    return response.data
  }

  const createProjectRequest = async (input: CreateProjectInput): Promise<Project> => {
    const response = await apiClient.post('/api/projects', input)
    return response.data
  }

  const {
    data: projects = [],
    isPending,
    error,
    refetch: fetchProjects,
  } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: fetchProjectsRequest,
    enabled: !!workspaceId,
  })

  const createProjectMutation = useMutation({
    mutationFn: createProjectRequest,
    onSuccess: (newProject) => {
      queryClient.setQueryData(['projects', workspaceId], (old: Project[] = []) => [...old, newProject])
    },
  })

  return {
    projects,
    isLoading: isPending,
    error: error?.message || null,
    fetchProjects,
    createProject: createProjectMutation.mutateAsync,
    isCreating: createProjectMutation.isPending,
  }
}
