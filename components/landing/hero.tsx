'use client'

import { ArrowRight, ArrowUp, Globe, Smartphone, Users } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AuthDialog } from '@/components/auth/auth-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { useAuth } from '@/hooks/use-auth'
import apiClient from '@/libs/utils/axios'

const PLACEHOLDER_TEXTS = [
  'I want to build a mobile app for fitness tracking.',
  'I need to create a SaaS platform for team collaboration.',
  'I have an idea for an e-commerce website.',
]

export function HeroSection() {
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
      toast.error('Failed to create chat')
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
    <section className="pb-12 pt-8 md:pb-24 md:pt-16">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-6 text-center md:gap-10">
          <div className="flex flex-col items-center gap-5 md:gap-7">
            {/* Badge */}
            <div className="border-1 relative inline-flex items-center gap-1.5 rounded-full border-zinc-900 bg-white px-4 py-2 text-xs font-medium text-zinc-900 shadow-sm md:px-5 md:py-2.5 md:text-sm">
              Jotlin is an
              <span className="relative mr-2 inline-block bg-[linear-gradient(90deg,#00C6B1_0%,#00AA9B_100%)] bg-clip-text font-semibold text-transparent">
                AI agent
                <Image
                  src="/landing/agent-start.svg"
                  alt=""
                  width={7}
                  height={7}
                  className="absolute -right-2 top-0.5"
                />
              </span>
              that interviews you.
            </div>
            <div className="flex flex-col items-center gap-2">
              {/* Main Title */}
              <h1 className="h-15 px-4 text-[28px] font-medium leading-tight text-zinc-900 md:px-0 md:text-[40px] md:leading-normal">
                Turn Messy Ideas into{' '}
                <span className="bg-[linear-gradient(90deg,#00C6B1_0%,#00AA9B_100%)] bg-clip-text text-transparent">
                  Structured Specs
                </span>
              </h1>

              {/* Description */}
              <p className="max-w-2xl px-4 text-sm leading-6 text-zinc-500 md:px-0 md:text-base">
                Jotlin asks clarifying questions to flesh out your idea and generates professional specs as you chat ——
                so you can get back to the fun part: coding.
              </p>
            </div>
          </div>

          {/* Input Box */}
          <div className="w-full max-w-3xl px-4 md:px-0">
            <div
              className="relative rounded-[16px] p-[1px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05),0_4px_6px_-2px_rgba(0,0,0,0.02)] md:rounded-[20px]"
              style={{
                background: `
                  linear-gradient(to right, #5EEAD4 0%, rgba(94, 234, 212, 0) 25%) left top / 100% 1px no-repeat,
                  linear-gradient(to bottom, #5EEAD4 0%, rgba(94, 234, 212, 0) 50%) left top / 1px 100% no-repeat,
                  radial-gradient(circle at top left, #5EEAD4 0%, #5EEAD4 50%, rgba(94, 234, 212, 0) 70%) 0 0 / 20px 20px no-repeat,
                  #E4E4E7
                `,
              }}>
              <div className="relative h-[120px] overflow-hidden rounded-[15px] bg-white md:h-[150px] md:rounded-[19px]">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  placeholder={placeholder}
                  className="h-full w-full resize-none border-none bg-transparent px-4 pb-12 pt-3 text-sm placeholder-zinc-500 shadow-none focus-visible:border-none focus-visible:ring-0 md:px-5 md:pb-14 md:pt-4 md:text-base"
                />
                <Button
                  size="icon"
                  onClick={handleSubmit}
                  className="absolute bottom-2 right-2 rounded-[10px] bg-zinc-800 p-2 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.16),0px_4px_6px_-2px_rgba(0,0,0,0.05)] hover:bg-zinc-800 disabled:opacity-40 md:bottom-2.5 md:right-3"
                  disabled={!input.trim() || isCreatingChat}>
                  <ArrowUp className="size-4 text-white md:size-5" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-left text-xs leading-5 text-zinc-500 md:mt-2.5 md:text-sm">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>

          {/* Example Cards */}
          <div className="flex w-full flex-col gap-3 px-4 md:flex-row md:px-0">
            <button
              onClick={() => handleExampleClick('I want to build a mobile app for fitness tracking')}
              disabled={isCreatingChat}
              className="flex items-center gap-2 rounded-2xl border-[0.5px] border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition-all hover:border-zinc-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:gap-3 md:rounded-full md:px-5 md:py-4">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 shrink-0 text-zinc-400 md:size-5" strokeWidth={1.5} />
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs leading-5 text-zinc-900 md:text-sm">
                    I want to build a mobile app for fitness tracking
                  </p>
                  <p className="text-[10px] leading-4 text-zinc-500 md:text-xs">
                    Help me define the core features and user scenarios
                  </p>
                </div>
              </div>
              <ArrowRight className="size-3 shrink-0 text-zinc-400 md:size-3.5" strokeWidth={1.5} />
            </button>

            <button
              onClick={() => handleExampleClick('I need to create a SaaS platform for team collaboration')}
              disabled={isCreatingChat}
              className="flex items-center gap-2 rounded-2xl border-[0.5px] border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition-all hover:border-zinc-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:gap-3 md:rounded-full md:px-5 md:py-4">
              <div className="flex items-center gap-2">
                <Users className="size-4 shrink-0 text-zinc-400 md:size-5" strokeWidth={1.5} />
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs leading-5 text-zinc-900 md:text-sm">
                    I need to create a SaaS platform for team collaboration
                  </p>
                  <p className="text-[10px] leading-4 text-zinc-500 md:text-xs">
                    Guide me through requirement gathering process
                  </p>
                </div>
              </div>
              <ArrowRight className="size-3 shrink-0 text-zinc-400 md:size-3.5" strokeWidth={1.5} />
            </button>

            <button
              onClick={() => handleExampleClick('I have an idea for an e-commerce website')}
              disabled={isCreatingChat}
              className="flex items-center gap-2 rounded-2xl border-[0.5px] border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition-all hover:border-zinc-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:gap-3 md:rounded-full md:px-5 md:py-4">
              <div className="flex items-center gap-2">
                <Globe className="size-4 shrink-0 text-zinc-400 md:size-5" strokeWidth={1.5} />
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs leading-5 text-zinc-900 md:text-sm">I have an idea for an e-commerce website</p>
                  <p className="text-[10px] leading-4 text-zinc-500 md:text-xs">
                    Let&apos;s start with user stories and key features
                  </p>
                </div>
              </div>
              <ArrowRight className="size-3 shrink-0 text-zinc-400 md:size-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <AuthDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </section>
  )
}
