import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export async function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect(redirectTo)
  }

  return <>{children}</>
}
