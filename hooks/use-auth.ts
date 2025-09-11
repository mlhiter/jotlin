'use client'

import { useRouter } from 'next/navigation'

import { useSession, signIn, signOut } from '@/lib/auth-client'

export const useAuth = () => {
  const router = useRouter()
  const { data, isPending, error, refetch } = useSession()

  const _signIn = async (provider: 'github' | 'google' | 'email') => {
    if (provider === 'github') {
      await signIn.social({
        provider: 'github',
        callbackURL: '/chat',
        errorCallbackURL: '/error',
        newUserCallbackURL: '/chat',
      })
    }
  }

  const _signOut = async () => {
    await signOut({
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
    signIn: _signIn,
    signOut: _signOut,
  }
}
