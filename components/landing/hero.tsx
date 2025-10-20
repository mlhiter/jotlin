'use client'

import { ArrowRight, Globe, Smartphone, Users } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AuthDialog } from '@/components/auth/auth-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from '@/i18n/navigation'
import apiClient from '@/lib/axios'

const PLACEHOLDER_TEXTS = [
  'I want to build a mobile app for fitness tracking.',
  'I need to create a SaaS platform for team collaboration.',
  'I have an idea for an e-commerce website.',
]

export function HeroSection() {
  const t = useTranslations('landing.hero')
  const tChat = useTranslations('chat')
  const [input, setInput] = useState('')
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [placeholder, setPlaceholder] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const storedMessage = localStorage.getItem('pendingMessage')
    if (storedMessage) {
      if (isAuthenticated) {
        setPendingMessage(storedMessage)
        localStorage.removeItem('pendingMessage')
      } else {
      }
    }
  }, [isAuthenticated])

  // Typing effect for placeholder
  useEffect(() => {
    if (input) return

    const currentText = PLACEHOLDER_TEXTS[placeholderIndex]
    let currentIndex = 0
    let isDeleting = false
    let typingTimeout: NodeJS.Timeout

    const type = () => {
      if (!isDeleting && currentIndex <= currentText.length) {
        setPlaceholder(currentText.slice(0, currentIndex))
        currentIndex++
        typingTimeout = setTimeout(type, 50)
      } else if (!isDeleting && currentIndex > currentText.length) {
        typingTimeout = setTimeout(() => {
          isDeleting = true
          type()
        }, 2000)
      } else if (isDeleting && currentIndex > 0) {
        currentIndex--
        setPlaceholder(currentText.slice(0, currentIndex))
        typingTimeout = setTimeout(type, 30)
      } else if (isDeleting && currentIndex === 0) {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length)
      }
    }

    type()

    return () => clearTimeout(typingTimeout)
  }, [placeholderIndex, input])

  const handleCreateChat = async (message: string) => {
    if (isCreatingChat) return

    setIsCreatingChat(true)
    try {
      const response = await apiClient.post('/api/chats', { title: message.slice(0, 50) })
      const chat = response.data

      // Navigate with query parameter using Next.js router
      const url = `/chat/${chat.id}?message=${encodeURIComponent(message)}`
      router.push(url)
    } catch (error) {
      console.error('[Hero] Failed to create chat:', error)
      toast.error(tChat('failedToCreate'))
      setIsCreatingChat(false)
    }
  }

  useEffect(() => {
    if (pendingMessage && isAuthenticated && !isCreatingChat) {
      handleCreateChat(pendingMessage)
      setPendingMessage(null)
    }
  }, [pendingMessage, isAuthenticated])

  const handleSubmit = () => {
    if (!input.trim() || isCreatingChat) return

    if (!isAuthenticated) {
      localStorage.setItem('pendingMessage', input)
      setShowLoginDialog(true)
      return
    }

    handleCreateChat(input)
  }

  const handleExampleClick = (exampleText: string) => {
    if (isCreatingChat) return

    if (!isAuthenticated) {
      localStorage.setItem('pendingMessage', exampleText)
      setShowLoginDialog(true)
      return
    }

    handleCreateChat(exampleText)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
  }

  return (
    <section className="pt-16 pb-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Badge */}
          <div className="relative inline-flex items-center gap-1.5 rounded-full border-2 border-gray-900 bg-white px-5 py-2.5 text-sm shadow-sm">
            <span className="text-gray-700">{t('badge.prefix')}</span>
            <span className="font-semibold text-cyan-500">{t('badge.highlight')}</span>
            <span className="text-gray-700">{t('badge.suffix')}</span>
          </div>

          {/* Main Title */}
          <h1 className="max-w-4xl text-5xl leading-tight font-bold tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
            {t('title.prefix')}{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">
              {t('title.highlight')}
            </span>
          </h1>

          {/* Description */}
          <p className="max-w-2xl text-base text-gray-700 md:text-lg">{t('description')}</p>

          {/* Input Box */}
          <div className="w-full max-w-3xl">
            <div className="rounded-[20px] border border-cyan-300 bg-white">
              <div className="relative h-[150px] overflow-hidden rounded-[inherit]">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  placeholder={placeholder}
                  className="h-full w-full resize-none border-none bg-transparent px-5 pt-4 pb-14 text-base placeholder-zinc-500 shadow-none focus-visible:border-none focus-visible:ring-0"
                />
                <Button
                  size="icon"
                  onClick={handleSubmit}
                  className="absolute right-3 bottom-2.5 size-9 rounded-[10px] bg-zinc-800 p-2 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.16),0px_4px_6px_-2px_rgba(0,0,0,0.05)] hover:bg-zinc-800 disabled:opacity-40"
                  disabled={!input.trim() || isCreatingChat}>
                  <Image
                    src="/landing/icon-arrow-up.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="brightness-0 invert"
                  />
                </Button>
              </div>
            </div>
            <p className="mt-2.5 text-left text-sm leading-5 text-zinc-500">{t('input.hint')}</p>
          </div>

          {/* Example Cards */}
          <div className="flex w-full gap-3">
            <button
              onClick={() => handleExampleClick(t('examples.0.title'))}
              disabled={isCreatingChat}
              className="flex items-center gap-3 rounded-full border-[0.5px] border-zinc-200 bg-zinc-50 px-5 py-4 text-left transition-all hover:border-zinc-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
              <div className="flex items-center gap-2">
                <Smartphone className="size-5 shrink-0 text-zinc-400" strokeWidth={1.5} />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm leading-5 text-zinc-900">{t('examples.0.title')}</p>
                  <p className="text-xs leading-4 text-zinc-500">{t('examples.0.description')}</p>
                </div>
              </div>
              <ArrowRight className="size-3.5 shrink-0 text-zinc-400" strokeWidth={1.5} />
            </button>

            <button
              onClick={() => handleExampleClick(t('examples.1.title'))}
              disabled={isCreatingChat}
              className="flex items-center gap-3 rounded-full border-[0.5px] border-zinc-200 bg-zinc-50 px-5 py-4 text-left transition-all hover:border-zinc-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
              <div className="flex items-center gap-2">
                <Users className="size-5 shrink-0 text-zinc-400" strokeWidth={1.5} />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm leading-5 text-zinc-900">{t('examples.1.title')}</p>
                  <p className="text-xs leading-4 text-zinc-500">{t('examples.1.description')}</p>
                </div>
              </div>
              <ArrowRight className="size-3.5 shrink-0 text-zinc-400" strokeWidth={1.5} />
            </button>

            <button
              onClick={() => handleExampleClick(t('examples.2.title'))}
              disabled={isCreatingChat}
              className="flex items-center gap-3 rounded-full border-[0.5px] border-zinc-200 bg-zinc-50 px-5 py-4 text-left transition-all hover:border-zinc-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
              <div className="flex items-center gap-2">
                <Globe className="size-5 shrink-0 text-zinc-400" strokeWidth={1.5} />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm leading-5 text-zinc-900">{t('examples.2.title')}</p>
                  <p className="text-xs leading-4 text-zinc-500">{t('examples.2.description')}</p>
                </div>
              </div>
              <ArrowRight className="size-3.5 shrink-0 text-zinc-400" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <AuthDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </section>
  )
}
