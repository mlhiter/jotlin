'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { ChatInput } from '@/components/chat/chat-input'
import { EmptyState } from '@/components/chat/empty-state'
import { PageHeader } from '@/components/page-header'

export default function ChatPage() {
  const router = useRouter()

  const handleSendMessage = async (message: { text: string }) => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: message.text.slice(0, 50) }),
      })

      if (!response.ok) {
        throw new Error('Failed to create chat')
      }

      const chat = await response.json()

      router.push(`/chat/${chat.id}?message=${encodeURIComponent(message.text)}`)
    } catch (error) {
      console.error('Failed to create chat:', error)
      toast.error('Failed to create chat')
    }
  }

  return (
    <div className="h-[calc(100vh-24px)] flex flex-col overflow-hidden">
      <PageHeader title="Chat" />
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <EmptyState onSendMessage={handleSendMessage} />
          </div>
          <ChatInput onSendMessage={handleSendMessage} onStop={() => {}} status="ready" />
        </div>
      </div>
    </div>
  )
}
