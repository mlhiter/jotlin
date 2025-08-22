import { GET, POST, DELETE, PUT } from '@/libs/axios'
import { Doc } from '@/types/document'

export type DocumentInfo = Pick<Doc, 'title' | 'icon'>

export const documentApi = {
  getList: async (data: { parentDocumentId: string | null; type: string }) => {
    return GET<Doc[]>('/api/documents/list', data)
  },

  getById: async (id: string) => {
    return GET<Doc>(`/api/documents/${id}`)
  },

  getSearchDocuments: async () => {
    return GET<Doc[]>('/api/documents/get-search')
  },

  getBasicInfoById: async (id: string) => {
    return GET<DocumentInfo>(`/api/documents/${id}/get-basic-info`)
  },

  getTrashDocuments: async () => {
    return GET<Doc[]>('/api/documents/get-trash')
  },

  create: async (data: { title: string; parentDocument: string | null }) => {
    return POST<Doc>('/api/documents/create', data)
  },

  createFromMarkdown: async (data: {
    title: string
    markdownContent: string
    parentDocument?: string | null
    chatId?: string
  }) => {
    return POST<{ id: string; title: string; markdownContent: string }>('/api/documents/create-from-markdown', data)
  },

  update: async (data: Doc) => {
    return PUT<Doc>(`/api/documents/${data.id}`, data)
  },

  archive: async (id: string) => {
    return PUT(`/api/documents/${id}/archive`)
  },

  restore: async (id: string) => {
    return PUT(`/api/documents/${id}/restore`)
  },

  remove: async (id: string) => {
    return DELETE(`/api/documents/${id}`)
  },

  removeIcon: async (id: string) => {
    return DELETE(`/api/documents/${id}/remove-icon`)
  },

  removeCoverImage: async (id: string) => {
    return DELETE(`/api/documents/${id}/remove-cover-image`)
  },

  removeAccess: async (data: { documentId: string; collaboratorEmail: string }) => {
    return PUT('/api/documents/remove-access', data)
  },
}
