'use client'

import { Github } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createSealosApp, sealosApp } from 'sealos-desktop-sdk/app'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useAuth } from '@/hooks/use-auth'
import { useSealosAuth } from '@/hooks/use-sealos-auth'
import { SealosSession } from '@/schema/session'

export function LoginForm() {
  const { isLoading, signIn, session } = useAuth()
  const { authenticateWithSealos, isLoading: isSealosLoading, error } = useSealosAuth()
  const [sealosAvailable, setSealosAvailable] = useState<boolean | null>(null)
  const [hasAttemptedSealosAuth, setHasAttemptedSealosAuth] = useState(false)

  useEffect(() => {
    if (session || hasAttemptedSealosAuth) {
      return
    }

    const response = createSealosApp()

    ;(async () => {
      try {
        const sealosSession = (await sealosApp.getSession()) as unknown as SealosSession
        console.log('Sealos session detected:', sealosSession)

        if (sealosSession) {
          setSealosAvailable(true)
          setHasAttemptedSealosAuth(true)
          const success = await authenticateWithSealos(sealosSession)
          if (!success) {
            console.error('Sealos authentication failed:', error)
          }
        } else {
          setSealosAvailable(false)
          setHasAttemptedSealosAuth(true)
        }
      } catch (error) {
        setSealosAvailable(false)
        setHasAttemptedSealosAuth(true)
      }
    })()

    return response
  }, [session, hasAttemptedSealosAuth, authenticateWithSealos, error])

  if (sealosAvailable === null || isSealosLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to Jotlin</CardTitle>
            <CardDescription>Checking authentication status...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to Jotlin</CardTitle>
          <CardDescription>
            {sealosAvailable ? 'Sign in to your account to continue' : 'Sign in with GitHub to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          {!sealosAvailable && (
            <Button onClick={() => signIn('github')} disabled={isLoading} className="w-full" size="lg">
              <Github className="mr-2 h-4 w-4" />
              {isLoading ? 'Signing in...' : 'Continue with GitHub'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
