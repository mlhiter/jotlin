import { GET, POST, DELETE, PUT } from '@/libs/axios'

import { Doc } from '@/types/document'

export const getDocumentList = (data: {
  parentDocumentId: string | null
  type: string
}) => GET<Doc[]>('/api/documents/list', data)

export const getDocumentById = (id: string) => GET<Doc>(`/api/documents/${id}`)

export const getSearchDocuments = () => GET<Doc[]>('/api/documents/get-search')

export type DocumentInfo = Pick<Doc, 'title' | 'icon'>
export const getBasicInfoById = (id: string) =>
  GET<DocumentInfo>(`/api/documents/${id}/get-basic-info`)

export const getTrashDocuments = () => GET<Doc[]>('/api/documents/get-trash')

export const createDocument = (data: {
  title: string
  parentDocument: string | null
}) => POST<Doc>('/api/documents/create', data)

export const archiveDocument = (id: string) =>
  PUT(`/api/documents/${id}/archive`)

export const restoreDocument = (id: string) =>
  PUT(`/api/documents/${id}/restore`)

export const removeDocument = (id: string) => DELETE(`/api/documents/${id}`)

export const updateDocument = (data: Doc) =>
  PUT<Doc>(`/api/documents/${data.id}`, data)

export const removeDocumentIcon = (id: string) =>
  DELETE(`/api/documents/${id}/remove-icon`)

export const removeCoverImage = (id: string) =>
  DELETE(`/api/documents/${id}/remove-cover-image`)

export const removeDocumentAccess = (data: {
  documentId: string
  collaboratorEmail: string
}) => PUT('/api/documents/remove-access', data)
