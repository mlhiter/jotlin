import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type SearchStore = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  toggle: () => void
}

export const useSearch = create(
  immer<SearchStore>((set, get) => ({
    isOpen: false,
    onOpen: () =>
      set((state) => {
        state.isOpen = true
      }),
    onClose: () =>
      set((state) => {
        state.isOpen = false
      }),
    toggle: () =>
      set((state) => {
        state.isOpen = !get().isOpen
      }),
  }))
)
