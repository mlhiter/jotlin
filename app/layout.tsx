import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import { ModalProvider } from '@/components/providers/modal-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

import type { Metadata } from 'next'

import './globals.css'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="jotlin-theme">
            <Toaster position="bottom-right" />
            <ModalProvider />
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
