'use client'

import { useRouter } from 'next/navigation'

import { authClient } from '@/lib/auth-client'

export const useSession = () => {
  const router = useRouter()
  const { data, isPending, error, refetch } = authClient.useSession()

  const signIn = async (provider: 'github' | 'google' | 'email') => {
    if (provider === 'github') {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/documents',
        errorCallbackURL: '/error',
        newUserCallbackURL: '/documents',
      })
    }
  }

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/')
        },
      },
    })
  }

  return {
    session: data?.session,
    user: data?.user,
    isLoading: isPending,
    error,
    refetch,
    signIn,
    signOut,
  }
}
