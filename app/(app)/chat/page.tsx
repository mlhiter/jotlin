'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { ChatInput } from '@/components/chat/chat-input'
import { EmptyState } from '@/components/chat/empty-state'
import { PageHeader } from '@/components/page-header'

import { useChats } from '@/hooks/use-chat'

export const dynamic = 'force-dynamic'

const PENDING_MESSAGE_KEY = 'jotlin_pending_message'

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { createChat } = useChats()
  const fromPreview = searchParams.get('from') === 'preview'

  useEffect(() => {
    if (fromPreview) {
      const pendingMessage = sessionStorage.getItem(PENDING_MESSAGE_KEY)
      if (pendingMessage) {
        const createChatFromPending = async () => {
          try {
            sessionStorage.removeItem(PENDING_MESSAGE_KEY)
            const chat = await createChat(pendingMessage.slice(0, 50))
            router.replace(`/chat/${chat.id}?message=${encodeURIComponent(pendingMessage)}`)
          } catch (error) {
            console.error('Failed to create chat from pending message:', error)
            toast.error('Failed to create chat')
          }
        }
        createChatFromPending()
      }
    }
  }, [fromPreview, createChat, router])

  const handleSendMessage = async (message: { text: string }) => {
    try {
      console.info('Creating chat with message:', message)
      const chat = await createChat(message.text.slice(0, 50))
      router.push(`/chat/${chat.id}?message=${encodeURIComponent(message.text)}`)
    } catch (error) {
      console.error('Failed to create chat:', error)
      toast.error('Failed to create chat')
    }
  }

  return (
    <div className="flex h-[calc(100vh-24px)] flex-col overflow-hidden">
      <PageHeader title="Chat" />
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto">
            <EmptyState onSendMessage={handleSendMessage} />
          </div>
          <ChatInput onSendMessage={handleSendMessage} onStop={() => {}} status="ready" autoFocus />
        </div>
      </div>
    </div>
  )
}
