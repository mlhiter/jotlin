'use client'

import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'

import { useRouter, usePathname } from '@/i18n/navigation'

const LOCALE_STORAGE_KEY = 'preferred-locale'

export function useLocaleStorage() {
  const currentLocale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  // Handle hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  const getStoredLocale = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(LOCALE_STORAGE_KEY)
  }

  const setStoredLocale = (locale: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  }

  const changeLocale = (newLocale: string) => {
    if (!isClient) return

    setStoredLocale(newLocale)
    router.replace(pathname, { locale: newLocale })
  }

  useEffect(() => {
    if (!isClient) return

    const storedLocale = getStoredLocale()
    if (storedLocale && storedLocale !== currentLocale) {
      router.replace(pathname, { locale: storedLocale })
    } else if (!storedLocale) {
      setStoredLocale(currentLocale)
    }
  }, [isClient, currentLocale, pathname, router])

  return {
    currentLocale,
    changeLocale,
    isClient,
  }
}
