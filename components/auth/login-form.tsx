'use client'

import { Github } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { createSealosApp, sealosApp } from 'sealos-desktop-sdk/app'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useAuth } from '@/hooks/use-auth'
import { useSealosAuth } from '@/hooks/use-sealos-auth'
import { SealosSession } from '@/schema/session'

export function LoginForm() {
  const t = useTranslations('auth')
  const { isLoading, signIn, session } = useAuth()
  const { authenticateWithSealos, isLoading: isSealosLoading, error } = useSealosAuth()
  const [sealosAvailable, setSealosAvailable] = useState<boolean>(false)
  const hasCheckedSealos = useRef(false)

  useEffect(() => {
    if (session || hasCheckedSealos.current) {
      return
    }

    const response = createSealosApp()

    const checkSealosAuth = async () => {
      try {
        hasCheckedSealos.current = true

        const sealosSession = (await sealosApp.getSession()) as unknown as SealosSession

        if (sealosSession) {
          setSealosAvailable(true)
          await authenticateWithSealos(sealosSession)
        } else {
          setSealosAvailable(false)
        }
      } catch (error) {
        console.error('Sealos session check failed:', error)
        setSealosAvailable(false)
      }
    }

    checkSealosAuth()

    return response
  }, [session, authenticateWithSealos])

  if (sealosAvailable && isSealosLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t('welcome')}</CardTitle>
            <CardDescription>{t('checkingAuth')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
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
          <CardTitle>{t('welcome')}</CardTitle>
          <CardDescription>{t('signInToContinue')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="text-center text-sm text-red-500">{error.message}</div>}
          <Button onClick={() => signIn('github')} disabled={isLoading} className="w-full" size="lg">
            <Github className="mr-2 h-4 w-4" />
            {isLoading ? t('signingIn') : t('continueWithGithub')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
