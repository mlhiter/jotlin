'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export function LandingWrapper({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const originalTheme = theme
    setTheme('light')

    return () => {
      if (originalTheme) {
        setTheme(originalTheme)
      }
    }
  }, [theme, setTheme])

  return <>{children}</>
}
