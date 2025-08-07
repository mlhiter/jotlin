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
    return PUT<Chat>(`/api/chats/${chatId}`, { isArchived: true })
  },

  restore: async (chatId: string) => {
    return PUT<Chat>(`/api/chats/${chatId}`, { isArchived: false })
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

  streamAIResponse: async (
    chatId: string, 
    message: string, 
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              onComplete()
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                onChunk(parsed.content)
              } else if (parsed.error) {
                onError(new Error(parsed.error))
                return
              }
            } catch (e) {
              // Ignore malformed JSON
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error)
    }
  },
}
