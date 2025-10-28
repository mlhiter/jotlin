'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/store/auth-store'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = '/' }: AuthGuardProps) {
  const { user, isLoading, isInitialized } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Don't redirect if there's a token in URL (OAuth callback in progress)
    const hasTokenInUrl = searchParams.get('token')
    if (hasTokenInUrl) {
      return
    }

    // Only redirect if fully initialized, not loading, and no user
    // Add a small delay to ensure token from URL is processed first
    if (isInitialized && !isLoading && !user) {
      const timeoutId = setTimeout(() => {
        // Double check after delay by reading directly from store
        const currentState = useAuthStore.getState()
        if (!currentState.user && !currentState.isLoading) {
          router.push(redirectTo)
        }
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [user, isLoading, isInitialized, router, redirectTo, searchParams])

  return <>{children}</>
}
