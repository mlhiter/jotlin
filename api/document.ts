import { useEffect } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'

import axios from '@/lib/axios'
import { useDocument } from '@/stores/use-document'

export interface Doc {
  _id: string
  title?: string
  userId?: string
  isArchived?: boolean
  isPublished?: boolean
  collaborators?: [string]
  parentDocument?: string
  content?: string
  icon?: string
  coverImage?: string
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data)

// get document by Id
export const useDocumentById = (id: string) => {
  const { data, mutate, error, isLoading } = useSWR<Doc>(
    `/api/document/get-by-id?id=${id}`,
    fetcher
  )
  const { document, onSetDocument } = useDocument()
  useEffect(() => {
    if (data) {
      onSetDocument(data as Doc)
    }
  }, [data])
  return {
    document,
    mutate,
    error,
    isLoading,
  }
}

// get sidebar info
export const useSidebar = (parentDocumentId: string, type: string) => {
  const {
    data: documents,
    mutate,
    error,
    isLoading,
  } = useSWR<Doc[]>(
    `/api/document/sidebar?parentDocument=${parentDocumentId}&type=${type}`,
    fetcher
  )
  return {
    documents,
    mutate,
    error,
    isLoading,
  }
}

// get search document
export const useSearchDocuments = () => {
  const {
    data: documents,
    mutate,
    error,
    isLoading,
  } = useSWR<Doc[]>('/api/document/get-search', fetcher)
  return {
    documents,
    mutate,
    error,
    isLoading,
  }
}

// get basic information by id: title and icon
type DocumentInfo = Pick<Doc, 'title' | 'icon'>
export const useBasicInfoById = (id: string) => {
  const {
    data: documentInfo,
    mutate,
    error,
    isLoading,
  } = useSWR<DocumentInfo>(
    `/api/document/get-basic-info-by-id?id=${id}`,
    fetcher
  )
  return {
    documentInfo,
    mutate,
    error,
    isLoading,
  }
}

// get documents which are archived
export const useTrash = () => {
  const {
    data: documents,
    mutate,
    error,
    isLoading,
  } = useSWR<Doc[]>('/api/document/get-trash', fetcher)
  return {
    documents,
    mutate,
    error,
    isLoading,
  }
}

// create a new document
export const create = async (title: string, parentDocument: string) => {
  const res = await axios.post('/api/document/create', {
    title,
    parentDocument,
  })
  globalMutate(
    (key) => typeof key === 'string' && key.startsWith('/api/document/sidebar')
  )
  return res.data
}

// archive a document to trash
export const archive = async (id: string) => {
  await axios.put(`/api/document/archive?id=${id}`)
  globalMutate(
    (key) => typeof key === 'string' && key.startsWith('/api/document/sidebar')
  )
}

// restore document to normal
export const restore = async (id: string) => {
  await axios.put(`/api/document/restore?id=${id}`)
  globalMutate(
    (key) => typeof key === 'string' && key.startsWith('/api/document/sidebar')
  )
  globalMutate(
    (key) =>
      typeof key === 'string' && key.startsWith('/api/document/get-trash')
  )
}

// remove document forever
export const remove = async (id: string) => {
  await axios.delete(`/api/document/remove?id=${id}`)
  globalMutate(
    (key) =>
      typeof key === 'string' && key.startsWith('/api/document/get-trash')
  )
}

// update document content
// TODO: update document content to global store
export const update = async (document: Doc) => {
  const res = await axios.put('/api/document/update', document)
  globalMutate(
    (key) => typeof key === 'string' && key.startsWith('/api/document/sidebar')
  )
  return res.data
}

// remove Icon
export const removeIcon = async (id: string) => {
  const res = await axios.delete(`/api/document/remove-icon?id=${id}`)
  return res.data
}

// remove coverImage
export const removeCoverImage = async (id: string) => {
  const res = await axios.delete(`/api/document/remove-cover-image?id=${id}`)
  return res.data
}

// remove access to this document
export const removeAccess = async (
  documentId: string,
  collaboratorEmail: string
) => {
  await axios.put('/api/document/remove-access', {
    documentId,
    collaboratorEmail,
  })
  globalMutate(
    (key) =>
      typeof key === 'string' && key.startsWith('/api/document/get-by-id')
  )
}
