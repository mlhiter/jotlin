'use client'

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Menu, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AuthDialog } from '@/components/auth/auth-dialog'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

import { useAuth } from '@/hooks/use-auth'

export function LandingHeader() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleStartClick = () => {
    if (isAuthenticated) {
      router.push('/chat')
    } else {
      setShowLoginDialog(true)
    }
  }

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false)
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <header className="sticky top-0 z-50 w-full px-3 pb-2 pt-4 md:px-6 md:pt-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-xl bg-white/80 px-4 py-2 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.05),0px_4px_6px_-2px_rgba(0,0,0,0.02)] backdrop-blur-[49.5px] md:px-6">
        <div className="flex items-center gap-4 md:gap-9">
          <Link href="/" className="shrink-0">
            <Image src="/logo-with-text.svg" alt="Jotlin" width={74} height={22} className="h-5 w-auto" />
          </Link>

          <div className="hidden items-center gap-5 lg:flex">
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

        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-900 hover:bg-zinc-100">
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-white p-0" aria-describedby={undefined}>
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden>
              <div className="flex flex-col">
                <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
                  <Image src="/logo-with-text.svg" alt="Jotlin" width={74} height={22} />
                </div>
                <nav className="flex flex-col gap-1 p-4">
                  <button
                    onClick={() => handleNavClick('#how-it-works')}
                    className="rounded-lg px-4 py-3 text-left text-base text-zinc-900 transition-colors hover:bg-zinc-100">
                    How it works
                  </button>
                  <button
                    onClick={() => handleNavClick('#features')}
                    className="rounded-lg px-4 py-3 text-left text-base text-zinc-900 transition-colors hover:bg-zinc-100">
                    Features
                  </button>
                  <button
                    onClick={() => handleNavClick('#why-us')}
                    className="rounded-lg px-4 py-3 text-left text-base text-zinc-900 transition-colors hover:bg-zinc-100">
                    Why us
                  </button>
                  <button
                    onClick={() => handleNavClick('#faq')}
                    className="rounded-lg px-4 py-3 text-left text-base text-zinc-900 transition-colors hover:bg-zinc-100">
                    FAQ
                  </button>
                  <div className="my-4 border-t border-zinc-200" />
                  <a
                    href="https://discord.gg/44NTBsAYx9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-4 py-3 text-base text-zinc-900 transition-colors hover:bg-zinc-100">
                    <Image src="/landing/discord-icon.svg" alt="" width={16} height={16} />
                    Join our Discord
                  </a>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <a
            href="https://discord.gg/44NTBsAYx9"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-10 items-center justify-center gap-2 rounded-xl border border-white bg-gradient-to-b from-[#fcfcfc] to-[#fafafa] px-4 py-2 text-sm font-medium leading-5 text-zinc-900 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05),0_4px_6px_-2px_rgba(0,0,0,0.02)] transition-colors hover:from-[#f9f9f9] hover:to-[#f5f5f5] md:flex">
            <Image src="/landing/discord-icon.svg" alt="" width={16} height={16} />
            <span className="hidden lg:inline">Join our Discord</span>
          </a>
          <button
            onClick={handleStartClick}
            className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-black bg-[linear-gradient(192deg,#353540_8.86%,#1C1C1F_91.87%)] px-3 py-2 text-sm font-medium leading-5 text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.16),0_4px_6px_-2px_rgba(0,0,0,0.05)] transition-opacity hover:opacity-90 md:h-10 md:gap-2 md:px-4">
            <span className="text-xs md:text-sm">Start for free</span>
            <Sparkles className="size-3.5 md:size-4" strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      <AuthDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} redirectTo="/chat" />
    </header>
  )
}
