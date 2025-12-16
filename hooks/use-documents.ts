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

interface CreateDocumentInput {
  workspaceId: string
  projectId?: string | null
  title: string
  icon?: string
  documentType?: string
  content?: string
}

export function useDocuments(params: { projectId?: string; workspaceId?: string; enabled?: boolean }) {
  const queryClient = useQueryClient()
  const { projectId, workspaceId, enabled = true } = params

  const fetchDocumentsRequest = async (): Promise<Document[]> => {
    if (!projectId && !workspaceId) return []
    const query = projectId ? `projectId=${projectId}` : `workspaceId=${workspaceId}`
    const response = await apiClient.get(`/api/documents?${query}`)
    return response.data
  }

  const createDocumentRequest = async (input: CreateDocumentInput): Promise<Document> => {
    const response = await apiClient.post('/api/documents', input)
    return response.data
  }

  const queryKey = projectId ? ['documents', 'project', projectId] : ['documents', 'workspace', workspaceId]

  const {
    data: documents = [],
    isPending,
    error,
    refetch: fetchDocuments,
  } = useQuery({
    queryKey,
    queryFn: fetchDocumentsRequest,
    enabled: enabled && !!(projectId || workspaceId),
  })

  const createDocumentMutation = useMutation({
    mutationFn: createDocumentRequest,
    onSuccess: (newDocument) => {
      queryClient.setQueryData(queryKey, (old: Document[] = []) => [...old, newDocument])

      if (newDocument.projectId) {
        queryClient.setQueryData(['projects', newDocument.workspaceId], (old: any[] = []) => {
          return old.map((project) => {
            if (project.id === newDocument.projectId) {
              return {
                ...project,
                _count: {
                  ...project._count,
                  documents: project._count.documents + 1,
                },
              }
            }
            return project
          })
        })
      }
    },
  })

  return {
    documents,
    isLoading: isPending,
    error: error?.message || null,
    fetchDocuments,
    createDocument: createDocumentMutation.mutateAsync,
    isCreating: createDocumentMutation.isPending,
  }
}
