import { create } from 'zustand'

type AuthStore = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export const useAuth = create<AuthStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}))
