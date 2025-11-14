'use client'

import { Calendar, User } from 'lucide-react'
import dynamicImport from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'

import { MessageList } from '@/components/chat/message-list'
import { TryButton } from '@/components/preview/try-button'
import { PhaseProgress } from '@/components/project/phase-progress'

import { parseAIResponse } from '@/libs/ai/xml-parser'
import apiClient from '@/libs/utils/axios'
import { MyUIMessage } from '@/schema/chat'

const DraftPanel = dynamicImport(
  () => import('@/components/chat/draft-panel').then((mod) => ({ default: mod.DraftPanel })),
  {
    ssr: false,
  }
)

interface PublicChat {
  id: string
  title: string | null
  messages: MyUIMessage[]
  createdAt: string
  updatedAt: string
  author: string
  documents?: {
    requirement?: { id: string; content: string; status: string } | null
    architecture?: { id: string; content: string; status: string } | null
    development?: { id: string; content: string; status: string } | null
  } | null
  phaseChats?: Array<{
    id: string
    title: string | null
    phase: 'DISCOVERY' | 'FEATURE_BENCHMARK' | 'MARKET_POSITIONING' | null
    createdAt: string
    messages: MyUIMessage[]
  }> | null
}

export default function ChatPreviewPage() {
  const params = useParams()
  const chatId = params.chatId as string

  const [chat, setChat] = useState<PublicChat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<{
    requirement?: { content: string; status: string }
    architecture?: { content: string; status: string }
    development?: { content: string; status: string }
  }>({})
  const [showDraftPanel, setShowDraftPanel] = useState(true)
  const [phaseChats, setPhaseChats] = useState<Array<{
    id: string
    title: string | null
    phase: 'DISCOVERY' | 'FEATURE_BENCHMARK' | 'MARKET_POSITIONING' | null
    createdAt: string
    messages: MyUIMessage[]
  }> | null>(null)
  const [currentPhase, setCurrentPhase] = useState<'DISCOVERY' | 'FEATURE_BENCHMARK' | 'MARKET_POSITIONING' | null>(null)
  const [displayMessages, setDisplayMessages] = useState<MyUIMessage[]>([])

  useEffect(() => {
    const loadPublicChat = async () => {
      try {
        const response = await apiClient.get(`/api/chats/${chatId}/public`)
        setChat(response.data)

        if (response.data.documents) {
          const docsData = {
            ...(response.data.documents.requirement && { requirement: response.data.documents.requirement }),
            ...(response.data.documents.architecture && { architecture: response.data.documents.architecture }),
            ...(response.data.documents.development && { development: response.data.documents.development }),
          }
          setDocuments(docsData)
        }

        if (response.data.phaseChats && response.data.phaseChats.length > 0) {
          setPhaseChats(response.data.phaseChats)
          const lastPhase = response.data.phaseChats[response.data.phaseChats.length - 1]
          setCurrentPhase(lastPhase.phase)
          setDisplayMessages(lastPhase.messages || [])
        } else {
          setDisplayMessages(response.data.messages || [])
        }
      } catch (error) {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number } }
          if (axiosError.response?.status === 404) {
            setError('Link Expired')
            return
          }
        }
        console.error('Failed to load public chat:', error)
        setError('Failed to load chat')
      } finally {
        setIsLoading(false)
      }
    }

    if (chatId) {
      loadPublicChat()
    }
  }, [chatId])

  const handlePhaseSwitch = (phase: 'DISCOVERY' | 'FEATURE_BENCHMARK' | 'MARKET_POSITIONING') => {
    if (!phaseChats) return

    const targetPhaseChat = phaseChats.find((pc) => pc.phase === phase)
    if (targetPhaseChat) {
      setCurrentPhase(phase)
      setDisplayMessages(targetPhaseChat.messages || [])
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <div className="text-muted-foreground">Loading chat...</div>
        </div>
      </div>
    )
  }

  if (error || !chat) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <div className="bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <svg
              className="text-muted-foreground h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-foreground text-lg font-semibold">Link Expired</h3>
            <p className="text-muted-foreground text-sm">
              This sharing link has expired or the chat has been set to private
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Filter empty assistant messages
  const filteredMessages = displayMessages.filter((message) => {
    if (message.role === 'assistant') {
      const hasContent = message.parts.some((part) => part.type === 'text' && part.text.trim().length > 0)
      return hasContent
    }
    return true
  })

  // Calculate phase progress
  const phaseProgress = phaseChats
    ? [
        {
          phase: 'DISCOVERY' as const,
          status: documents.requirement
            ? ('completed' as const)
            : phaseChats.some((pc) => pc.phase === 'DISCOVERY')
              ? currentPhase === 'DISCOVERY'
                ? ('in-progress' as const)
                : ('completed' as const)
              : ('pending' as const),
        },
        {
          phase: 'FEATURE_BENCHMARK' as const,
          status: documents.architecture
            ? ('completed' as const)
            : phaseChats.some((pc) => pc.phase === 'FEATURE_BENCHMARK')
              ? currentPhase === 'FEATURE_BENCHMARK'
                ? ('in-progress' as const)
                : ('completed' as const)
              : ('pending' as const),
        },
        {
          phase: 'MARKET_POSITIONING' as const,
          status: documents.development
            ? ('completed' as const)
            : phaseChats.some((pc) => pc.phase === 'MARKET_POSITIONING')
              ? currentPhase === 'MARKET_POSITIONING'
                ? ('in-progress' as const)
                : ('completed' as const)
              : ('pending' as const),
        },
      ]
    : []

  // Extract live draft/final content from messages
  const liveContent = filteredMessages.reduce(
    (acc, message) => {
      if (message.role === 'assistant') {
        message.parts.forEach((part) => {
          if (part.type === 'text') {
            const parsed = parseAIResponse(part.text)
            if (parsed.final) {
              acc.final = parsed.final
            }
            if (parsed.draft) {
              acc.draft = parsed.draft
            }
          }
        })
      }
      return acc
    },
    { draft: undefined as string | undefined, final: undefined as string | undefined }
  )

  const hasDocument = !!(
    documents.requirement ||
    documents.architecture ||
    documents.development ||
    liveContent.draft ||
    liveContent.final
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 py-4">
        <h1 className="text-lg font-semibold">{chat.title || 'Untitled Chat'}</h1>
        <div className="flex flex-1 items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {chat.author}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(chat.createdAt).toLocaleDateString()}
            </div>
          </div>
          <TryButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Phase Progress Bar */}
        {phaseProgress.length > 0 && (
          <PhaseProgress
            phases={phaseProgress}
            currentPhase={currentPhase}
            onPhaseClick={handlePhaseSwitch}
            clickable={true}
          />
        )}

        <div className="flex flex-1 items-stretch overflow-hidden">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-muted-foreground">No messages in this chat</div>
            </div>
          ) : (
            <>
              {/* Left side: Chat Messages */}
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <div
                  className={`flex h-full flex-col overflow-hidden transition-all duration-700 ease-in-out ${
                    showDraftPanel ? 'mx-0' : 'mx-auto w-full max-w-4xl'
                  }`}>
                  <MessageList
                    messages={filteredMessages}
                    status="ready"
                    onRetry={() => {}}
                    onSendMessage={() => {}}
                    onUpdateMessage={() => {}}
                    onRollback={() => {}}
                  />
                </div>
              </div>

              {/* Right side: DraftPanel */}
              {hasDocument && (
                <DraftPanel
                  documents={documents}
                  isVisible={showDraftPanel}
                  onToggle={() => setShowDraftPanel(!showDraftPanel)}
                  chatId={chatId}
                  liveDraft={liveContent.draft}
                  liveFinal={liveContent.final}
                  readOnly={true}
                  currentPhase={currentPhase}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2">
        <div className="text-muted-foreground text-center text-xs">
          This is a read-only preview of a public chat conversation.
        </div>
      </div>
    </div>
  )
}
