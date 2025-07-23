import { GET, POST, DELETE, PUT } from '@/libs/axios'

import { Doc } from '@/types/document'

export const getDocumentList = (data: {
  parentDocumentId: string
  type: string
}) => GET<Doc[]>('/api/documents/list', data)

export const getDocumentById = (id: string) => GET<Doc>(`/api/documents/${id}`)

export const getSearchDocuments = () => GET<Doc[]>('/api/documents/get-search')

export type DocumentInfo = Pick<Doc, 'title' | 'icon'>
export const getBasicInfoById = (id: string) =>
  GET<DocumentInfo>(`/api/documents/get-basic-info-by-id?id=${id}`)

export const getTrashDocuments = () => GET<Doc[]>('/api/documents/get-trash')

export const createDocument = (data: {
  title: string
  parentDocument: string | null
}) => POST<Doc>('/api/documents/create', data)

export const archiveDocument = (id: string) =>
  PUT(`/api/documents/archive?id=${id}`)

export const restoreDocument = (id: string) =>
  PUT(`/api/documents/restore?id=${id}`)

export const removeDocument = (id: string) =>
  DELETE(`/api/documents/remove?id=${id}`)

export const updateDocument = (data: Doc) =>
  PUT<Doc>(`/api/documents/${data.id}`, data)

export const removeDocumentIcon = (id: string) =>
  DELETE(`/api/documents/remove-icon?id=${id}`)

export const removeCoverImage = (id: string) =>
  DELETE(`/api/documents/remove-cover-image?id=${id}`)

export const removeDocumentAccess = (data: {
  documentId: string
  collaboratorEmail: string
}) => PUT('/api/documents/remove-access', data)
