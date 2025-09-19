'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

import { useRouter } from '@/i18n/navigation'
import apiClient, { getAuthToken, setAuthToken, removeAuthToken } from '@/lib/axios'
import { AuthSession } from '@/schema/session'

export const useAuth = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCheckedUrlToken, setHasCheckedUrlToken] = useState(false)

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = getAuthToken()
      if (!token) {
        setSession(null)
        setIsLoading(false)
        return
      }

      const response = await apiClient.get('/api/auth/session')

      if (response.status === 200 && response.data.user && response.data.session) {
        setSession({ user: response.data.user, token: response.data.session.token })
      } else {
        setSession(null)
        removeAuthToken()
      }
    } catch {
      setError('Failed to fetch session')
      setSession(null)
      removeAuthToken()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only check for token once when component mounts or when we haven't checked yet
    if (!hasCheckedUrlToken) {
      const tokenFromUrl = searchParams.get('token')
      if (tokenFromUrl) {
        setAuthToken(tokenFromUrl)
        const url = new URL(window.location.href)
        url.searchParams.delete('token')
        window.history.replaceState({}, '', url.toString())
        fetchSession()
      } else {
        fetchSession()
      }
      setHasCheckedUrlToken(true)
    }
  }, [fetchSession, searchParams, hasCheckedUrlToken])

  const signIn = async (provider: 'github') => {
    try {
      setError(null)
      if (provider === 'github') {
        window.location.href = '/api/auth/github'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      setError(errorMessage)
    }
  }

  const signOut = async () => {
    try {
      setError(null)

      await apiClient.post('/api/auth/logout')

      removeAuthToken()
      setSession(null)
      router.push('/login')
    } catch (err) {
      removeAuthToken()
      setSession(null)
      router.push('/login')

      const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
      setError(errorMessage)
    }
  }

  const refetch = async () => {
    await fetchSession()
  }

  return {
    user: session?.user || null,
    session,
    isLoading,
    error,
    signIn,
    signOut,
    refetch,
  }
}
