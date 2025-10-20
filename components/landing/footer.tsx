'use client'

import { Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { AuthDialog } from '@/components/auth/auth-dialog'
import { Button } from '@/components/ui/button'

import { useAuth } from '@/hooks/use-auth'
import { Link, useRouter } from '@/i18n/navigation'

export function LandingFooter() {
  const t = useTranslations('landing.footer')
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
      <div className="pointer-events-none absolute top-0 left-1/2 h-24 w-[3524px] -translate-x-1/2">
        <Image src="/landing/footer-bg.svg" alt="" fill className="object-cover" />
      </div>

      <div className="relative container mx-auto max-w-full px-12 py-10">
        <div className="mb-20 text-center">
          <h2 className="mb-6 text-4xl font-medium text-white">{t('cta.title')}</h2>
          <p className="mb-10 text-xl text-zinc-500">{t('cta.description')}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="h-11 rounded-xl bg-zinc-50 px-8 text-zinc-900 hover:bg-zinc-50/90"
              onClick={handleStartClick}>
              {t('cta.primary')}
              <Sparkles className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 rounded-xl border-white/20 bg-transparent text-white hover:border-white/30 hover:bg-white/10 hover:text-white"
              asChild>
              <a href="https://discord.gg/jotlin" target="_blank" rel="noopener noreferrer">
                <Image src="/landing/discord-icon.svg" alt="" width={16} height={16} className="invert" />
                {t('cta.secondary')}
              </a>
            </Button>
          </div>
        </div>

        <AuthDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />

        <div className="border-t border-zinc-900 pt-12">
          <div className="flex items-center justify-between">
            <Image src="/logo-with-text.svg" alt="Jotlin" width={100} height={22} className="invert" />

            <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-5">
              <Link
                href="#how-it-works"
                className="rounded-md px-2 py-1 text-base text-zinc-500 transition-colors hover:text-zinc-400">
                {t('links.product.howItWorks')}
              </Link>
              <Link
                href="#features"
                className="rounded-md px-2 py-1 text-base text-zinc-500 transition-colors hover:text-zinc-400">
                {t('links.product.features')}
              </Link>
              <Link
                href="#who-its-for"
                className="rounded-md px-2 py-1 text-base text-zinc-500 transition-colors hover:text-zinc-400">
                {t('links.product.whosItFor')}
              </Link>
              <Link
                href="#faq"
                className="rounded-md px-2 py-1 text-base text-zinc-500 transition-colors hover:text-zinc-400">
                {t('links.product.faq')}
              </Link>
            </nav>

            <p className="text-base text-zinc-500">{t('copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
