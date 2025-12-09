import { MyUIMessage } from '@/schema/chat'

export interface ProjectData {
  rootChatId: string
  phaseChats: PhaseChat[]
  currentPhase: 'REQUIREMENT' | null
}

export interface PhaseChat {
  id: string
  title: string | null
  phase: 'REQUIREMENT' | null
  createdAt: string
  messages: MyUIMessage[]
}

export interface MessagePart {
  type: string
  text?: string
  image?: string | URL | ArrayBuffer | Uint8Array | Buffer
  data?: string | ArrayBuffer | Uint8Array | Buffer
  mimeType?: string
  url?: string
  filename?: string
}

export interface Quote {
  id: string
  text: string
}

export interface SelectedOption {
  value: string
  text: string
}
