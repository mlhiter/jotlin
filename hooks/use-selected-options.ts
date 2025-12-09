'use client'

import { create } from 'zustand'

import type { SelectedOption } from '@/types/chat'

interface SelectedOptionsStore {
  selectedOptions: SelectedOption[]
  currentAssistantMessageId: string | null

  setSelectedOptions: (options: SelectedOption[]) => void
  addOption: (option: SelectedOption) => void
  removeOption: (value: string) => void
  clearOptions: () => void
  toggleOption: (option: SelectedOption, messageId?: string) => void
}

export const useSelectedOptions = create<SelectedOptionsStore>((set) => ({
  selectedOptions: [],
  currentAssistantMessageId: null,

  setSelectedOptions: (options) => set({ selectedOptions: options }),

  addOption: (option) =>
    set((state) => ({
      selectedOptions: [...state.selectedOptions, option],
    })),

  removeOption: (value) =>
    set((state) => ({
      selectedOptions: state.selectedOptions.filter((opt) => opt.value !== value),
    })),

  clearOptions: () => set({ selectedOptions: [], currentAssistantMessageId: null }),

  toggleOption: (option, messageId) =>
    set((state) => {
      const exists = state.selectedOptions.find((opt) => opt.value === option.value)
      if (exists) {
        return {
          selectedOptions: state.selectedOptions.filter((opt) => opt.value !== option.value),
          currentAssistantMessageId: state.currentAssistantMessageId,
        }
      } else {
        return {
          selectedOptions: [...state.selectedOptions, option],
          currentAssistantMessageId: messageId || state.currentAssistantMessageId,
        }
      }
    }),
}))
