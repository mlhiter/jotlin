import { Doc } from './document'

export interface Chat {
  id: string
  title: string
  description: string | null
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
  documents?: Doc[]

  messages?: Message[]
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: string | Date
  updatedAt: string | Date
  chatId: string
  userId: string
}

export interface CreateChatRequest {
  title: string
  description?: string
}

export interface UpdateChatRequest {
  title?: string
  description?: string
  isArchived?: boolean
}

export interface CreateMessageRequest {
  content: string
  role: 'user' | 'assistant'
  chatId: string
}
