'use client'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { ChatInput } from '@/components/chat/chat-input'
import { EmptyState } from '@/components/chat/empty-state'
import { PageHeader } from '@/components/page-header'

import { useChats } from '@/hooks/use-chat'
import { useRouter } from '@/i18n/navigation'

export default function ChatPage() {
  const t = useTranslations('chat')
  const router = useRouter()
  const { createChat } = useChats()

  const handleSendMessage = async (message: { text: string }) => {
    try {
      const chat = await createChat(message.text.slice(0, 50))
      router.push(`/chat/${chat.id}?message=${encodeURIComponent(message.text)}`)
    } catch (error) {
      console.error('Failed to create chat:', error)
      toast.error(t('failedToCreate'))
    }
  }

  return (
    <div className="flex h-[calc(100vh-24px)] flex-col overflow-hidden">
      <PageHeader title={t('title')} />
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto">
            <EmptyState onSendMessage={handleSendMessage} />
          </div>
          <ChatInput onSendMessage={handleSendMessage} onStop={() => {}} status="ready" />
        </div>
      </div>
    </div>
  )
}
