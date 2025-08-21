import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type SettingsStore = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export const useSettings = create(
  immer<SettingsStore>((set) => ({
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
