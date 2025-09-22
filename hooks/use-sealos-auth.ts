import { useState, useCallback } from 'react'

import { useRouter } from '@/i18n/navigation'
import apiClient, { setAuthToken } from '@/lib/axios'
import { SealosSession } from '@/schema/session'

export function useSealosAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const authenticateWithSealos = useCallback(
    async (sealosSession: SealosSession) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await apiClient.post('/api/auth/sealos', {
          sealosSession,
        })

        const data = response.data

        if (data.success && data.token) {
          setAuthToken(data.token)
          router.push('/chat')
          return true
        } else {
          setError(data.error || 'Authentication failed')
          return false
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } }; message?: string }
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        setError(errorMessage)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [router]
  )

  return {
    authenticateWithSealos,
    isLoading,
    error,
  }
}
