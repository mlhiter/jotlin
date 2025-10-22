'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import apiClient from '@/libs/utils/axios'
import { AuthSession, User } from '@/schema/session'

interface AuthStore {
  // State
  user: User | null
  token: string | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  _hasHydrated: boolean

  // Actions
  setAuth: (session: AuthSession) => void
  clearAuth: () => void
  fetchSession: () => Promise<void>
  signOut: () => Promise<void>
  initialize: () => void
  setHasHydrated: (hasHydrated: boolean) => void
}

const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]))
    if (!decoded.exp) return true

    return decoded.exp * 1000 - Date.now() < 5 * 60 * 1000 // 5 minutes buffer
  } catch {
    return true
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      _hasHydrated: false,

      setAuth: (session: AuthSession) => {
        set({
          user: session.user,
          token: session.token,
          error: null,
          isLoading: false,
          isInitialized: true,
        })
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          error: null,
          isLoading: false,
          isInitialized: true,
        })
      },

      fetchSession: async () => {
        const { token, setAuth, clearAuth } = get()

        if (!token) {
          clearAuth()
          return
        }

        set({ isLoading: true, error: null })

        try {
          const response = await apiClient.get('/api/auth/session')

          if (response.data.user && response.data.session) {
            setAuth({
              user: response.data.user,
              token: response.data.session.token,
            })
          } else {
            clearAuth()
          }
        } catch (error) {
          console.error('Failed to fetch session:', error)
          set({ error: 'Failed to fetch session' })
          clearAuth()
        } finally {
          // Only set isLoading to false, don't override isInitialized if it's already true
          const currentState = get()
          set({
            isLoading: false,
            isInitialized: currentState.isInitialized || true,
          })
        }
      },

      signOut: async () => {
        const { token, clearAuth } = get()

        if (token) {
          try {
            await apiClient.post('/api/auth/logout')
          } catch (error) {
            console.error('Logout failed:', error)
          }
        }

        clearAuth()
      },

      initialize: () => {
        const { token, isInitialized, _hasHydrated } = get()

        if (isInitialized || !_hasHydrated) {
          return
        }

        // If we have a persisted token, validate and fetch session
        if (token && !isTokenExpired(token)) {
          get().fetchSession()
        } else {
          // No valid token, mark as initialized but don't clear persisted data
          set({
            isLoading: false,
            isInitialized: true,
            error: null,
          })
        }
      },

      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated })
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated and trigger initialization
        if (state) {
          state.setHasHydrated(true)
          // Small delay to ensure state is fully restored
          setTimeout(() => {
            state.initialize()
          }, 0)
        }
      },
    }
  )
)
