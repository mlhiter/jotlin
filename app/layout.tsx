import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'

import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/sonner'

import type { Metadata } from 'next'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Jotlin Agent - Intelligent Chat Assistant',
  description: 'A modern AI-powered chat interface built with Next.js and Vercel AI SDK',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
