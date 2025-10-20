'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { useRouter } from '@/i18n/navigation'
import { useAuthStore } from '@/store/auth-store'

export const useAuth = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasInitialized = useRef(false)

  const store = useAuthStore()

  // Initialize on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      // Handle OAuth callback token
      const tokenFromUrl = searchParams.get('token')
      if (tokenFromUrl) {
        useAuthStore.setState({ token: tokenFromUrl })
        store.fetchSession()

        // Clean URL
        const url = new URL(window.location.href)
        url.searchParams.delete('token')
        window.history.replaceState({}, '', url.toString())
      } else {
        // Only initialize if no token from URL (initialization will be handled by onRehydrateStorage)
        store.initialize()
      }

      hasInitialized.current = true
    }
  }, [])

  const signIn = (provider: 'github', redirect?: string) => {
    if (provider === 'github') {
      const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
      window.location.href = `/api/auth/github${redirectParam}`
    }
  }

  const signOut = async () => {
    await store.signOut()
    router.push('/')
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
