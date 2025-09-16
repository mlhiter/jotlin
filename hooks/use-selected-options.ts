'use client'

import { create } from 'zustand'

interface SelectedOption {
  value: string
  text: string
}

interface SelectedOptionsStore {
  selectedOptions: SelectedOption[]
  setSelectedOptions: (options: SelectedOption[]) => void
  addOption: (option: SelectedOption) => void
  removeOption: (value: string) => void
  clearOptions: () => void
  toggleOption: (option: SelectedOption) => void
}

export const useSelectedOptions = create<SelectedOptionsStore>((set) => ({
  selectedOptions: [],

  setSelectedOptions: (options) => set({ selectedOptions: options }),

  addOption: (option) =>
    set((state) => ({
      selectedOptions: [...state.selectedOptions, option],
    })),

  removeOption: (value) =>
    set((state) => ({
      selectedOptions: state.selectedOptions.filter((opt) => opt.value !== value),
    })),

  clearOptions: () => set({ selectedOptions: [] }),

  toggleOption: (option) =>
    set((state) => {
      const exists = state.selectedOptions.find((opt) => opt.value === option.value)
      if (exists) {
        return {
          selectedOptions: state.selectedOptions.filter((opt) => opt.value !== option.value),
        }
      } else {
        return {
          selectedOptions: [...state.selectedOptions, option],
        }
      }
    }),
}))
