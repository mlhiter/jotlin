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
  collaborators?: ChatCollaborator[]
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
  user?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
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

export interface ChatCollaborator {
  id: string
  chatId: string
  userEmail: string
  createdAt: Date
}

export interface ChatInvitation {
  id: string
  chatId: string
  userEmail: string
  collaboratorEmail: string
  isAccepted: boolean
  isReplied: boolean
  isValid: boolean
  createdAt: Date
}

export interface CreateChatInvitationRequest {
  collaboratorEmail: string
}

export interface UpdateChatInvitationRequest {
  isAccepted: boolean
}
