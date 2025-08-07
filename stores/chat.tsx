import { create } from 'zustand'
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

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  isLoading: false,

  setChats: (chats) => set({ chats }),
  
  setActiveChat: (chat) => set({ activeChat: chat }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    )
  })),

  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter(msg => msg.id !== messageId)
  })),
  
  updateChat: (chatId, updates) => set((state) => ({
    chats: state.chats.map(chat =>
      chat.id === chatId ? { ...chat, ...updates } : chat
    ),
    activeChat: state.activeChat?.id === chatId
      ? { ...state.activeChat, ...updates }
      : state.activeChat
  })),
  
  removeChat: (chatId) => set((state) => ({
    chats: state.chats.filter(chat => chat.id !== chatId),
    activeChat: state.activeChat?.id === chatId ? null : state.activeChat
  })),
  
  setLoading: (loading) => set({ isLoading: loading })
}))