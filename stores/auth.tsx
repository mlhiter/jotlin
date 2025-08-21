import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type AuthStore = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export const useAuth = create(
  immer<AuthStore>((set) => ({
    isOpen: false,
    onOpen: () =>
      set((state) => {
        state.isOpen = true
      }),
    onClose: () =>
      set((state) => {
        state.isOpen = false
      }),
  }))
)
