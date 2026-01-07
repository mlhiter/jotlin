'use client'

import { useQuery } from '@tanstack/react-query'

import apiClient from '@/libs/utils/axios'

interface TrashProject {
  id: string
  title: string
  icon: string | null
  deletedAt: Date | string
  _count: {
    documents: number
    chatThreads: number
  }
}

interface TrashDocument {
  id: string
  title: string
  icon: string | null
  documentType: string
  deletedAt: Date | string
  project?: {
    id: string
    title: string
    icon: string | null
  } | null
  _count: {
    chatThreads: number
  }
}

interface TrashChatThread {
  id: string
  title: string | null
  type: string
  deletedAt: Date | string
  project?: {
    id: string
    title: string
    icon: string | null
  } | null
  document?: {
    id: string
    title: string
    icon: string | null
    documentType: string
  } | null
  _count: {
    messages: number
  }
}

export function useTrash(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['trash', workspaceId],
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required')
      const response = await apiClient.get(`/api/trash?workspaceId=${workspaceId}`)
      return response.data as {
        projects: TrashProject[]
        documents: TrashDocument[]
        chatThreads: TrashChatThread[]
      }
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 60, // 1 minute
  })
}
