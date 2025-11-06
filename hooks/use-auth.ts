'use client'

import { useEffect, useRef } from 'react'

import { useAuthStore } from '@/store/auth-store'

export const useAuth = () => {
  const hasInitialized = useRef(false)

  const store = useAuthStore()

  // Initialize on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      // Handle OAuth callback token from URL
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const tokenFromUrl = params.get('token')

        if (tokenFromUrl) {
          // Set loading state immediately to prevent AuthGuard from redirecting
          useAuthStore.setState({ token: tokenFromUrl, isLoading: true, isInitialized: false })
          store.fetchSession()

          // Clean URL
          const url = new URL(window.location.href)
          url.searchParams.delete('token')
          window.history.replaceState({}, '', url.toString())
        } else {
          // Only initialize if no token from URL (initialization will be handled by onRehydrateStorage)
          store.initialize()
        }
      }

      hasInitialized.current = true
    }
  }, [])

  const signIn = (provider: 'github' | 'google', redirect?: string) => {
    const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''

    if (provider === 'github') {
      window.location.href = `/api/auth/github${redirectParam}`
    } else if (provider === 'google') {
      window.location.href = `/api/auth/google${redirectParam}`
    }
  }

  const signOut = async () => {
    await store.signOut()
    window.location.href = '/'
  }

  return {
    ...store,
    isAuthenticated: !!(store.user && store.token),
    isAdmin: store.user?.role === 'ADMIN' || store.user?.role === 'SUPER_ADMIN',
    session: store.user && store.token ? { user: store.user, token: store.token } : null,
    signIn,
    signOut,
    refetch: store.fetchSession,
  }
}
