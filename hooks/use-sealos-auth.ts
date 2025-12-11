import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import apiClient from '@/libs/utils/axios'
import { SealosSession } from '@/schema/session'
import { useAuthStore } from '@/store/auth-store'

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
      if (data.success && data.token && data.user) {
        useAuthStore.getState().setAuth({
          user: data.user,
          token: data.token,
        })
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
