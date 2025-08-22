import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import { Chat, Message } from '@/types/chat'

interface ChatStore {
  chats: Chat[]
  activeChat: Chat | null
  messages: Message[]
  isLoading: boolean

  // Actions
  setChats: (chats: Chat[]) => void
  setActiveChat: (chat: Chat | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  removeMessage: (messageId: string) => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
  removeChat: (chatId: string) => void
  setLoading: (loading: boolean) => void
}

export const useChatStore = create(
  immer<ChatStore>((set) => ({
    chats: [],
    activeChat: null,
    messages: [],
    isLoading: false,

    setChats: (chats) =>
      set((state) => {
        state.chats = chats
      }),

    setActiveChat: (chat) =>
      set((state) => {
        state.activeChat = chat
      }),

    setMessages: (messages) =>
      set((state) => {
        state.messages = messages
      }),

    addMessage: (message) =>
      set((state) => {
        state.messages.push(message)
      }),

    updateMessage: (messageId, updates) =>
      set((state) => {
        const messageIndex = state.messages.findIndex((msg) => msg.id === messageId)
        if (messageIndex !== -1) {
          Object.assign(state.messages[messageIndex], updates)
        }
      }),

    removeMessage: (messageId) =>
      set((state) => {
        const messageIndex = state.messages.findIndex((msg) => msg.id === messageId)
        if (messageIndex !== -1) {
          state.messages.splice(messageIndex, 1)
        }
      }),

    updateChat: (chatId, updates) =>
      set((state) => {
        const chatIndex = state.chats.findIndex((chat) => chat.id === chatId)
        if (chatIndex !== -1) {
          Object.assign(state.chats[chatIndex], updates)
        }
        if (state.activeChat?.id === chatId) {
          Object.assign(state.activeChat, updates)
        }
      }),

    removeChat: (chatId) =>
      set((state) => {
        const chatIndex = state.chats.findIndex((chat) => chat.id === chatId)
        if (chatIndex !== -1) {
          state.chats.splice(chatIndex, 1)
        }
        if (state.activeChat?.id === chatId) {
          state.activeChat = null
        }
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading
      }),
  }))
)
