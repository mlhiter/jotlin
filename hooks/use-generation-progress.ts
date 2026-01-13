import { useQuery } from '@tanstack/react-query'

import apiClient from '@/libs/utils/axios'

interface GenerationProgress {
  status: string
  currentStep: string
  totalSteps: number
  completedSteps: number
  percentage: number
  generatedDocIds: string[]
  error?: string
  startedAt: string
  completedAt?: string
}

interface GenerationStatusResponse {
  isGenerating: boolean
  progress: GenerationProgress | null
}

export function useGenerationProgress(requirementDocId: string | null, enabled: boolean = true) {
  const query = useQuery<GenerationStatusResponse>({
    queryKey: ['generation-progress', requirementDocId],
    queryFn: async () => {
      if (!requirementDocId) {
        return { isGenerating: false, progress: null }
      }

      const response = await apiClient.get<GenerationStatusResponse>(
        `/documents/${requirementDocId}/generation-status`
      )
      return response.data
    },
    enabled: enabled && !!requirementDocId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false
      if (!data.isGenerating) return false
      return 2000 // Poll every 2 seconds while generating
    },
    refetchOnWindowFocus: false,
  })

  return query
}
