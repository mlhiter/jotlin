'use client'

import { useEffect } from 'react'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from '@/i18n/navigation'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = '/' }: AuthGuardProps) {
  const { user, isLoading, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, isInitialized, router, redirectTo])

  return <>{children}</>
}
