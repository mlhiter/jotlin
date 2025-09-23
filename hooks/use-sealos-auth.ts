import { useMutation } from '@tanstack/react-query'

import { useRouter } from '@/i18n/navigation'
import apiClient, { setAuthToken } from '@/lib/axios'
import { SealosSession } from '@/schema/session'

export function useSealosAuth() {
  const router = useRouter()

  const mutation = useMutation({
    mutationKey: ['sealos-auth'],
    mutationFn: async (sealosSession: SealosSession) => {
      const response = await apiClient.post('/api/auth/sealos', {
        sealosSession,
      })
      return response.data
    },
    onSuccess: (data) => {
      if (data.success && data.token) {
        setAuthToken(data.token)
        router.push('/chat')
      }
    },
    onError: (error) => {
      console.error('Sealos authentication failed:', error)
    },
    retry: false,
  })

  return {
    authenticateWithSealos: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  }
}
