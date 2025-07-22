import { AuthProvider } from 'better-auth/react'
import { authClient } from '@/lib/auth-client'

export function AuthClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider client={authClient}>{children}</AuthProvider>
}
