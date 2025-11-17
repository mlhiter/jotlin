'use client'

import { Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthDialog } from '@/components/auth/auth-dialog'
import { Button } from '@/components/ui/button'

import { useAuth } from '@/hooks/use-auth'

export function LandingFooter() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const handleStartClick = () => {
    if (isAuthenticated) {
      router.push('/chat')
    } else {
      setShowLoginDialog(true)
    }
  }

  return (
    <footer className="relative overflow-hidden bg-[#09090b]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-[3524px] -translate-x-1/2">
        <Image src="/landing/footer-bg.svg" alt="" fill className="object-cover" />
      </div>

      <div className="container relative mx-auto mt-12 max-w-full px-4 py-8 md:mt-20 md:px-12 md:py-10">
        <div className="mb-12 text-center md:mb-20">
          <h2 className="mb-4 px-4 text-2xl font-medium text-white md:mb-6 md:text-4xl">
            Your Next Great Idea is One Conversation Away.
          </h2>
          <p className="mb-6 text-base text-zinc-500 md:mb-10 md:text-xl">
            Try it instantly. No account or credit card required.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:flex-wrap md:gap-4">
            <Button
              size="lg"
              className="h-11 w-full rounded-xl bg-zinc-50 px-8 text-zinc-900 hover:bg-zinc-50/90 md:w-auto"
              onClick={handleStartClick}>
              Start for free
              <Sparkles className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 w-full rounded-xl border-white/20 bg-transparent text-white hover:border-white/30 hover:bg-white/10 hover:text-white md:w-auto"
              asChild>
              <a href="https://x.com/mlhiter" target="_blank" rel="noopener noreferrer">
                <Image src="/landing/x-icon.svg" alt="" width={16} height={16} className="invert" />
                Follow on X
              </a>
            </Button>
          </div>
        </div>

        <AuthDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />

        <div className="border-t border-zinc-900 pt-8 md:pt-12">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between md:gap-0">
            <Image
              src="/logo-with-text.svg"
              alt="Jotlin"
              width={80}
              height={18}
              className="invert md:h-[22px] md:w-[100px]"
            />

            <nav className="flex flex-wrap items-center justify-center gap-4 md:absolute md:left-1/2 md:-translate-x-1/2 md:gap-5">
              <Link
                href="#how-it-works"
                className="rounded-md px-2 py-1 text-sm text-zinc-500 transition-colors hover:text-zinc-400 md:text-base">
                How it works
              </Link>
              <Link
                href="#features"
                className="rounded-md px-2 py-1 text-sm text-zinc-500 transition-colors hover:text-zinc-400 md:text-base">
                Features
              </Link>
              <Link
                href="#who-its-for"
                className="rounded-md px-2 py-1 text-sm text-zinc-500 transition-colors hover:text-zinc-400 md:text-base">
                Who it&apos;s for
              </Link>
              <Link
                href="#faq"
                className="rounded-md px-2 py-1 text-sm text-zinc-500 transition-colors hover:text-zinc-400 md:text-base">
                FAQ
              </Link>
            </nav>

            <div className="flex flex-col items-center gap-2 md:items-end">
              <p className="text-sm text-zinc-500 md:text-base">
                © {new Date().getFullYear()} Jotlin. All rights reserved.
              </p>
              <div className="flex gap-4 text-xs text-zinc-500">
                <Link href="/privacy" className="transition-colors hover:text-zinc-400">
                  Privacy Policy
                </Link>
                <span>·</span>
                <Link href="/terms" className="transition-colors hover:text-zinc-400">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
