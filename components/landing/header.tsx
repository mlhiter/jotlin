'use client'

import { Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthDialog } from '@/components/auth/auth-dialog'

import { useAuth } from '@/hooks/use-auth'

export function LandingHeader() {
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
    <header className="sticky top-0 z-50 w-full px-6 pb-2 pt-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-xl bg-white/80 px-6 py-2 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.05),0px_4px_6px_-2px_rgba(0,0,0,0.02)] backdrop-blur-[49.5px]">
        <div className="flex items-center gap-9">
          <Link href="/" className="shrink-0">
            <Image src="/logo-with-text.svg" alt="Jotlin" width={74} height={22} />
          </Link>

          <div className="hidden items-center gap-5 md:flex">
            <Link
              href="#how-it-works"
              className="rounded-md px-2 py-1 text-base leading-6 text-black transition-colors hover:bg-zinc-100">
              How it works
            </Link>
            <Link
              href="#features"
              className="rounded-md px-2 py-1 text-base leading-6 text-black transition-colors hover:bg-zinc-100">
              Features
            </Link>
            <Link
              href="#why-us"
              className="rounded-md px-2 py-1 text-base leading-6 text-black transition-colors hover:bg-zinc-100">
              Why us
            </Link>
            <Link
              href="#faq"
              className="rounded-md px-2 py-1 text-base leading-6 text-black transition-colors hover:bg-zinc-100">
              FAQ
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://discord.gg/44NTBsAYx9"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white bg-gradient-to-b from-[#fcfcfc] to-[#fafafa] px-4 py-2 text-sm font-medium leading-5 text-zinc-900 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05),0_4px_6px_-2px_rgba(0,0,0,0.02)] transition-colors hover:from-[#f9f9f9] hover:to-[#f5f5f5]">
            <Image src="/landing/discord-icon.svg" alt="" width={16} height={16} />
            Join our Discord
          </a>
          <button
            onClick={handleStartClick}
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-black bg-[linear-gradient(192deg,#353540_8.86%,#1C1C1F_91.87%)] px-4 py-2 text-sm font-medium leading-5 text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.16),0_4px_6px_-2px_rgba(0,0,0,0.05)] transition-opacity hover:opacity-90">
            Start for free
            <Sparkles className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      <AuthDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} redirectTo="/chat" />
    </header>
  )
}
