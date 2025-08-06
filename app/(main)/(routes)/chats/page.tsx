'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { chatApi } from '@/api/chat'

const ChatsPage = () => {
  const router = useRouter()

  const { data: chats } = useQuery({
    queryKey: ['chats'],
    queryFn: chatApi.getList,
  })

  useEffect(() => {
    if (chats && chats.length > 0) {
      router.push(`/chats/${chats[0].id}`)
    }
  }, [chats, router])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <MessageSquare className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-2xl font-semibold text-muted-foreground">
        Start a new chat
      </h2>
      <p className="text-muted-foreground">
        Create a new chat from the left, or select an existing chat to continue
      </p>
    </div>
  )
}

export default ChatsPage
