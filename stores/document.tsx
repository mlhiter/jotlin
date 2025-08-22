import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import { Doc } from '@/types/document'
import { documentApi } from '@/api/document'

type DocumentStore = {
  // Current document state
  currentDocument: Doc | undefined | null
  setCurrentDocument: (doc: Doc | null) => void
  clearCurrentDocument: () => void

  // Document list state
  documentsMap: Record<string, Doc[]>
  setDocuments: (parentDocumentId: string | null, type: string) => Promise<Doc[]>
  getDocuments: (parentDocumentId: string | null, type: string) => Doc[] | undefined
}

export const useDocumentStore = create(
  immer<DocumentStore>((set, get) => ({
    currentDocument: undefined,
    setCurrentDocument: (doc) => {
      set((state) => {
        state.currentDocument = doc
      })
    },
    clearCurrentDocument: () => {
      set((state) => {
        state.currentDocument = undefined
      })
    },

    documentsMap: {},
    setDocuments: async (parentDocumentId, type) => {
      const res = await documentApi.getList({ parentDocumentId, type })
      set((state) => {
        const key = `${type}-${parentDocumentId}`
        state.documentsMap[key] = res
      })
      return res
    },
    getDocuments: (parentDocumentId, type) => {
      const key = `${type}-${parentDocumentId}`
      return get().documentsMap[key]
    },
  }))
)
