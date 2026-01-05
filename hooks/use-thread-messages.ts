import { useQuery } from '@tanstack/react-query'

import apiClient from '@/libs/utils/axios'
import { MyUIMessage } from '@/schema/chat'

interface UseThreadMessagesOptions {
  threadId: string | null
  enabled?: boolean
}

export function useThreadMessages({ threadId, enabled = true }: UseThreadMessagesOptions) {
  return useQuery({
    queryKey: ['threadMessages', threadId],
    queryFn: async () => {
      if (!threadId) return []

      const response = await apiClient.get(`/api/chat-threads/${threadId}/messages`)
      return (response.data.messages || []) as MyUIMessage[]
    },
    enabled: enabled && !!threadId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  })
}
