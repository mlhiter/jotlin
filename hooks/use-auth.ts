'use client'

import { useEffect, useState } from 'react'

import { authClient } from '@/auth-client'

export interface User {
  id: string
  name: string
  email: string
  image?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      try {
        const session = await authClient.getSession()
        if (session?.data?.user) {
          setUser({
            id: session.data.user.id,
            name: session.data.user.name,
            email: session.data.user.email,
            image: session.data.user.image || undefined,
          })
        }
      } catch (error) {
        console.error('Failed to get session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()
  }, [])

  return { user, isLoading }
}
