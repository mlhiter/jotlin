import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ConvexClientProvider } from '@/components/providers/convex-provider'
import { ModalProvider } from '@/components/providers/modal-provider'
import { EdgeStoreProvider } from '../lib/edgestore'

import './globals.css'
import AuthContext from '../context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jotlin',
  description: 'The connected workspace where better,faster work happens',
  icons: {
    icon: [
      {
        media: '(prefers-color-scheme:light)',
        url: '/logo.svg',
        href: '/logo.svg',
      },
      {
        media: '(prefers-color-scheme:dark)',
        url: '/logo-dark.svg',
        href: '/logo-dark.svg',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthContext>
          <ConvexClientProvider>
            <EdgeStoreProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
                storageKey="jotlin-theme">
                <Toaster position="bottom-center" />
                <ModalProvider />
                {children}
              </ThemeProvider>
            </EdgeStoreProvider>
          </ConvexClientProvider>
        </AuthContext>
      </body>
    </html>
  )
}
