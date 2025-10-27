'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { ChatInput } from '@/components/chat/chat-input'
import { EmptyState } from '@/components/chat/empty-state'
import { PageHeader } from '@/components/page-header'

import { useChats } from '@/hooks/use-chat'

export const dynamic = 'force-dynamic'

export default function ChatPage() {
  const router = useRouter()
  const { createChat } = useChats()

  const handleSendMessage = async (message: { text: string }) => {
    try {
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
