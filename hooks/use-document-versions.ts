'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import apiClient from '@/libs/utils/axios'

interface DocumentVersion {
  id: string
  documentId: string
  versionNumber: number
  content: string
  createdBy: string
  createdAt: string
}

export function useDocumentVersions(documentId: string) {
  const queryClient = useQueryClient()

  // Fetch versions
  const {
    data: versions = [],
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async (): Promise<DocumentVersion[]> => {
      const response = await apiClient.get(`/api/documents/${documentId}/versions`)
      return response.data.versions
    },
    enabled: !!documentId,
  })

  // Restore version
  const restoreMutation = useMutation({
    mutationFn: async (versionNumber: number) => {
      const response = await apiClient.post(
        `/api/documents/${documentId}/versions/${versionNumber}/restore`
      )
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate document query to refresh content
      queryClient.invalidateQueries({ queryKey: ['document', documentId] })

      // Invalidate versions to show new version after restore
      queryClient.invalidateQueries({ queryKey: ['document-versions', documentId] })

      toast.success(`Restored to version ${data.document.currentVersion}`)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Failed to restore version'
      toast.error(errorMessage)
    },
  })

  return {
    versions,
    isLoading: isPending,
    error: error?.message || null,
    refetchVersions: refetch,
    restoreVersion: restoreMutation.mutateAsync,
    isRestoring: restoreMutation.isPending,
  }
}
