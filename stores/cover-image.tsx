import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type CoverImageStore = {
  isOpen: boolean
  url?: string
  onOpen: () => void
  onClose: () => void
  onReplace: (url: string) => void
}

export const useCoverImage = create(
  immer<CoverImageStore>((set) => ({
    isOpen: false,
    url: undefined,
    onOpen: () =>
      set((state) => {
        state.isOpen = true
        state.url = undefined
      }),
    onClose: () =>
      set((state) => {
        state.isOpen = false
        state.url = undefined
      }),
    onReplace: (url: string) =>
      set((state) => {
        state.isOpen = true
        state.url = url
      }),
  }))
)
