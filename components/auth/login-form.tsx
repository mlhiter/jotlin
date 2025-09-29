'use client'

import { Github } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { createSealosApp, sealosApp } from 'sealos-desktop-sdk/app'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useAuth } from '@/hooks/use-auth'
import { useSealosAuth } from '@/hooks/use-sealos-auth'
import { useRouter } from '@/i18n/navigation'
import { SealosSession } from '@/schema/session'

export function LoginForm() {
  const t = useTranslations('auth')
  const router = useRouter()
  const { isLoading, signIn, session } = useAuth()
  const { authenticateWithSealos, isLoading: isSealosLoading, error } = useSealosAuth()
  const [sealosAvailable, setSealosAvailable] = useState<boolean>(false)
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false)

  useEffect(() => {
    if (session) {
      return
    }

    const response = createSealosApp()

    const checkSealosAuth = async () => {
      try {
        const sealosSession = (await sealosApp.getSession()) as unknown as SealosSession

        if (sealosSession) {
          setSealosAvailable(true)
          await authenticateWithSealos(sealosSession)
          setIsRedirecting(true)
          router.push('/chat')
        } else {
          setSealosAvailable(false)
        }
      } catch {
        setSealosAvailable(false)
      }
    }

    checkSealosAuth()

    return response
  }, [session])

  if (sealosAvailable && (isSealosLoading || isRedirecting)) {
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
