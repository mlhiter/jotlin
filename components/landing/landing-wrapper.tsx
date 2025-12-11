'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { createSealosApp, sealosApp } from 'sealos-desktop-sdk/app'

import { useAuth } from '@/hooks/use-auth'
import { useSealosAuth } from '@/hooks/use-sealos-auth'
import { SealosSession } from '@/schema/session'

export function LandingWrapper({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const { isAuthenticated } = useAuth()
  const { authenticateWithSealos } = useSealosAuth()
  const router = useRouter()
  const [isCheckingSealos, setIsCheckingSealos] = useState(true)

  useEffect(() => {
    const originalTheme = theme
    setTheme('light')

    return () => {
      if (originalTheme) {
        setTheme(originalTheme)
      }
    }
  }, [theme, setTheme])

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat')
      return
    }

    const cleanup = createSealosApp()

    ;(async () => {
      try {
        const sealosSession = (await sealosApp.getSession()) as unknown as SealosSession

        if (sealosSession) {
          await authenticateWithSealos(sealosSession)
        } else {
          setIsCheckingSealos(false)
        }
      } catch (error) {
        setIsCheckingSealos(false)
      }
    })()

    return cleanup
  }, [isAuthenticated, authenticateWithSealos, router])

  if (isCheckingSealos) {
    return null
  }

  return <>{children}</>
}
