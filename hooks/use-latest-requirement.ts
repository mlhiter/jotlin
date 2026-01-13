import { useQuery } from '@tanstack/react-query'

import apiClient from '@/libs/utils/axios'

interface LatestRequirementResponse {
  requirementDoc: {
    id: string
    title: string
    createdAt: string
  } | null
}

export function useLatestRequirement(projectId: string | null) {
  return useQuery<LatestRequirementResponse>({
    queryKey: ['latest-requirement', projectId],
    queryFn: async () => {
      if (!projectId) {
        return { requirementDoc: null }
      }

      const response = await apiClient.get<LatestRequirementResponse>(`/projects/${projectId}/latest-requirement`)
      return response.data
    },
    enabled: !!projectId,
    refetchOnWindowFocus: false,
    staleTime: 5000, // Cache for 5 seconds
  })
}
