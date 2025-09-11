'use client'

import { useState, useEffect } from 'react'

interface Chat {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  userId: string
  messages: Array<{
    id: string
    content: string
    role: string
    createdAt: string
  }>
  _count: {
    messages: number
  }
}

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChats = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/chats')
      if (!response.ok) {
        throw new Error('Failed to fetch chats')
      }

      const data = await response.json()
      setChats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chats')
    } finally {
      setIsLoading(false)
    }
  }

  const createChat = async (title?: string) => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error('Failed to create chat')
      }

      const newChat = await response.json()
      setChats((prev) => [newChat, ...prev])
      return newChat
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create chat')
    }
  }

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete chat')
      }

      setChats((prev) => prev.filter((chat) => chat.id !== chatId))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete chat')
    }
  }

  useEffect(() => {
    fetchChats()
  }, [])

  return {
    chats,
    isLoading,
    error,
    fetchChats,
    createChat,
    deleteChat,
  }
}
