import { GET, POST, DELETE, PUT } from '@/libs/axios'
import {
  Chat,
  CreateChatRequest,
  UpdateChatRequest,
  Message,
  CreateMessageRequest,
} from '@/types/chat'

export const chatApi = {
  getList: async () => {
    return GET<Chat[]>('/api/chats/list')
  },

  getById: async (chatId: string) => {
    return GET<Chat>(`/api/chats/${chatId}`)
  },

  create: async (data: CreateChatRequest) => {
    return POST<Chat>('/api/chats/create', data)
  },

  update: async (chatId: string, data: UpdateChatRequest) => {
    return PUT<Chat>(`/api/chats/${chatId}`, data)
  },

  archive: async (chatId: string) => {
    return PUT<Chat>(`/api/chats/${chatId}/archive`)
  },

  restore: async (chatId: string) => {
    return PUT<Chat>(`/api/chats/${chatId}/restore`)
  },

  delete: async (chatId: string) => {
    return DELETE(`/api/chats/${chatId}`)
  },

  getMessages: async (chatId: string) => {
    return GET<Message[]>(`/api/chats/${chatId}/messages`)
  },

  sendMessage: async (data: CreateMessageRequest) => {
    return POST<Message>('/api/messages/create', data)
  },

  linkDocument: async (chatId: string, documentId: string) => {
    return POST(`/api/chats/${chatId}/documents/${documentId}`)
  },

  unlinkDocument: async (chatId: string, documentId: string) => {
    return DELETE(`/api/chats/${chatId}/documents/${documentId}`)
  },

  getAIResponse: async (chatId: string, message: string) => {
    return POST<Message>(`/api/chats/${chatId}/ai-response`, { message })
  },
}
