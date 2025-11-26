'use client'

import { useQuery } from '@tanstack/react-query'
import { ChatPhase } from '@prisma/client'

import apiClient from '@/libs/utils/axios'

export interface Version {
  id: string
  title: string
  type: 'draft' | 'final'
  phase: ChatPhase
  content: string
  preview: string
  createdAt: string
}

interface VersionsResponse {
  versions: Version[]
}

export function useVersions(chatId: string | undefined) {
  const fetchVersionsRequest = async (): Promise<Version[]> => {
    if (!chatId) return []
    const response = await apiClient.get<VersionsResponse>(`/api/chats/${chatId}/versions`)
    return response.data.versions
  }

  const {
    data: versions = [],
    isLoading,
    error,
    refetch: refetchVersions,
  } = useQuery({
    queryKey: ['versions', chatId],
    queryFn: fetchVersionsRequest,
    enabled: !!chatId,
  })

  return {
    versions,
    isLoading,
    error: error?.message || null,
    refetchVersions,
  }
}
