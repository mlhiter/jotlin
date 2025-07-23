import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import { Doc } from '@/types/document'
import {
  getDocumentList,
  getDocumentById,
  getSearchDocuments,
  getBasicInfoById,
  getTrashDocuments,
  createDocument,
  archiveDocument,
  restoreDocument,
  removeDocument,
  updateDocument,
  removeDocumentIcon,
  removeCoverImage,
  removeDocumentAccess,
  DocumentInfo,
} from '@/api/document'

type DocumentStore = {
  // Current document state
  currentDocument: Doc | undefined
  setCurrentDocument: (doc: Doc) => void

  // Document list state
  documentsMap: Record<string, Doc[]>
  setDocuments: (parentDocumentId: string, type: string) => Promise<Doc[]>
  getDocuments: (parentDocumentId: string, type: string) => Doc[] | undefined

  // Search documents
  searchResults: Doc[] | undefined
  setSearchResults: () => Promise<void>

  // Trash documents
  trashDocuments: Doc[] | undefined
  setTrashDocuments: () => Promise<void>

  // Document operations
  fetchDocument: (id: string) => Promise<Doc>
  fetchBasicInfo: (id: string) => Promise<DocumentInfo>
  createDocument: (title: string, parentDocument: string) => Promise<Doc>
  archiveDocument: (id: string) => Promise<void>
  restoreDocument: (id: string) => Promise<void>
  removeDocument: (id: string) => Promise<void>
  updateDocument: (document: Doc) => Promise<Doc>
  removeDocumentIcon: (id: string) => Promise<void>
  removeCoverImage: (id: string) => Promise<void>
  removeDocumentAccess: (
    documentId: string,
    collaboratorEmail: string
  ) => Promise<void>
}

export const useDocumentStore = create(
  immer<DocumentStore>((set, get) => ({
    // Current document
    currentDocument: undefined,
    setCurrentDocument: (doc) => {
      set((state) => {
        state.currentDocument = doc
      })
    },

    // Document list
    documentsMap: {},
    setDocuments: async (parentDocumentId, type) => {
      const res = await getDocumentList({ parentDocumentId, type })
      set((state) => {
        const key = `${parentDocumentId}-${type}`
        state.documentsMap[key] = res
      })
      return res
    },
    getDocuments: (parentDocumentId, type) => {
      const key = `${parentDocumentId}-${type}`
      return get().documentsMap[key]
    },

    // Search documents
    searchResults: undefined,
    setSearchResults: async () => {
      const results = await getSearchDocuments()
      set((state) => {
        state.searchResults = results
      })
    },

    // Trash documents
    trashDocuments: undefined,
    setTrashDocuments: async () => {
      const results = await getTrashDocuments()
      set((state) => {
        state.trashDocuments = results
      })
    },

    // Document operations
    fetchDocument: async (id) => {
      const doc = await getDocumentById(id)
      set((state) => {
        state.currentDocument = doc
      })
      return doc
    },

    fetchBasicInfo: async (id) => {
      return await getBasicInfoById(id)
    },

    createDocument: async (title, parentDocument) => {
      const doc = await createDocument({ title, parentDocument })
      // Refresh the document list after creation
      const parentKey = `${parentDocument}-main`
      if (get().documentsMap[parentKey]) {
        await get().setDocuments(parentDocument, 'main')
      }
      return doc
    },

    archiveDocument: async (id) => {
      await archiveDocument(id)
      // Refresh relevant document lists
      const parentDocument = get().currentDocument?.parentDocument
      if (parentDocument) {
        await get().setDocuments(parentDocument, 'main')
      }
    },

    restoreDocument: async (id) => {
      await restoreDocument(id)
      // Refresh trash list
      await get().setTrashDocuments()
    },

    removeDocument: async (id) => {
      await removeDocument(id)
      // Refresh trash list
      await get().setTrashDocuments()
    },

    updateDocument: async (document) => {
      const updatedDoc = await updateDocument(document)
      if (get().currentDocument?.id === document.id) {
        set((state) => {
          state.currentDocument = updatedDoc
        })
      }
      return updatedDoc
    },

    removeDocumentIcon: async (id) => {
      await removeDocumentIcon(id)
      if (get().currentDocument?.id === id) {
        set((state) => {
          if (state.currentDocument) {
            state.currentDocument.icon = undefined
          }
        })
      }
    },

    removeCoverImage: async (id) => {
      await removeCoverImage(id)
      if (get().currentDocument?.id === id) {
        set((state) => {
          if (state.currentDocument) {
            state.currentDocument.coverImage = undefined
          }
        })
      }
    },

    removeDocumentAccess: async (documentId, collaboratorEmail) => {
      await removeDocumentAccess({ documentId, collaboratorEmail })
      if (get().currentDocument?.id === documentId) {
        await get().fetchDocument(documentId)
      }
    },
  }))
)
