import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Geist, Geist_Mono, Edu_QLD_Beginner } from 'next/font/google'
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

const eduQldBeginner = Edu_QLD_Beginner({
  variable: '--font-edu-qld-beginner',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Jotlin - AI Requirements Analysis Tool | Turn Ideas into PRD, User Stories & Tech Specs',
  description:
    'Transform messy product ideas into structured requirements with AI. Jotlin is an intelligent requirements engineering assistant that generates PRD, user stories, flow diagrams, and technical specifications through natural conversation. Perfect for product managers, developers, and startup founders.',
  keywords: [
    'AI requirements analysis',
    'PRD generator',
    'product requirements document',
    'user stories generator',
    'technical specifications',
    'requirements engineering',
    'AI product manager',
    'specification assistant',
    'product documentation',
    'software requirements',
    'agile user stories',
    'requirements gathering',
    'product management tool',
    'AI chatbot for PM',
    'automated documentation',
  ],
  openGraph: {
    title: 'Jotlin - AI Requirements Analysis Tool | Generate PRD & Specifications',
    description:
      'Turn rough ideas into production-ready documentation. AI-powered requirements gathering for product managers and developers.',
    type: 'website',
    url: 'https://jotlin.ai',
    siteName: 'Jotlin',
    images: [
      {
        url: 'https://jotlin.ai/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Jotlin - AI Requirements Analysis Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jotlin - AI Requirements Analysis Tool',
    description: 'Transform messy ideas into structured PRD, user stories, and tech specs with AI',
    images: ['https://jotlin.ai/og-image.png'],
  },
}

type Props = {
  children: React.ReactNode
}

export default function RootLayout({ children }: Props) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Jotlin',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'AI-powered requirements analysis tool that transforms product ideas into structured PRD, user stories, and technical specifications through intelligent conversation.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
    },
    featureList: [
      'AI-powered requirements gathering',
      'PRD and technical specification generation',
      'User story creation with acceptance criteria',
      'Flow diagram generation',
      'Risk assessment and tracking',
      'Real-time collaborative editing',
    ],
    author: {
      '@type': 'Organization',
      name: 'Jotlin Team',
    },
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${eduQldBeginner.variable} antialiased`}>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
