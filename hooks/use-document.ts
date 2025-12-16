'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/libs/utils/axios'

interface Document {
  id: string
  projectId: string | null
  workspaceId: string
  title: string
  content: string
  documentType: string
  icon: string | null
  createdAt: string
  updatedAt: string
  lastEditedAt: string
  isDeleted: boolean
  order: number
  isAIGenerated: boolean
  sourceMessageId: string | null
  _count: {
    chatThreads: number
  }
}

interface UpdateDocumentInput {
  content?: string
  title?: string
  documentType?: string
  icon?: string
}

export function useDocument(documentId: string) {
  const queryClient = useQueryClient()

  const fetchDocumentRequest = async (): Promise<Document> => {
    const response = await apiClient.get(`/api/documents/${documentId}`)
    return response.data
  }

  const updateDocumentRequest = async (input: UpdateDocumentInput): Promise<Document> => {
    const response = await apiClient.patch(`/api/documents/${documentId}`, input)
    return response.data
  }

  const queryKey = ['document', documentId]

  const {
    data: document,
    isPending,
    error,
    refetch: fetchDocument,
  } = useQuery({
    queryKey,
    queryFn: fetchDocumentRequest,
    enabled: !!documentId,
  })

  const updateDocumentMutation = useMutation({
    mutationFn: updateDocumentRequest,
    onSuccess: (updatedDocument) => {
      queryClient.setQueryData(queryKey, updatedDocument)

      if (updatedDocument.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['documents', 'project', updatedDocument.projectId],
        })
      }
    },
  })

  return {
    document,
    isLoading: isPending,
    error: error?.message || null,
    fetchDocument,
    updateDocument: updateDocumentMutation.mutateAsync,
    isUpdating: updateDocumentMutation.isPending,
  }
}
