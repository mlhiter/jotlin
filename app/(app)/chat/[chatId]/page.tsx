'use client'

import { useChat } from '@ai-sdk/react'
import { useQueryClient } from '@tanstack/react-query'
import { DefaultChatTransport } from 'ai'
import dynamicImport from 'next/dynamic'
import { useParams, useSearchParams, notFound } from 'next/navigation'
import { useState, useEffect, useRef, useMemo } from 'react'

import { ChatInput } from '@/components/chat/chat-input'
import { GenerationProgress } from '@/components/chat/generation-progress'
import { MessageList } from '@/components/chat/message-list'
import { PublicButton } from '@/components/chat/public-button'
import { PageHeader } from '@/components/page-header'
import { useSidebar } from '@/components/ui/sidebar'

const DraftPanel = dynamicImport(
  () => import('@/components/chat/draft-panel').then((mod) => ({ default: mod.DraftPanel })),
  {
    ssr: false,
  }
)

export const dynamic = 'force-dynamic'

import { useLatestRequirement } from '@/hooks/use-latest-requirement'
import { useMessageLimits } from '@/hooks/use-message-limits'
import { parseAIResponse } from '@/libs/ai/xml-parser'
import apiClient from '@/libs/utils/axios'
import { MyUIMessage } from '@/schema/chat'
import { useAuthStore } from '@/store/auth-store'

import type { SelectedOption } from '@/types/chat'

export default function ChatIdPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const chatId = params.chatId as string
  const initialMessage = searchParams.get('message')
  const { handleMessageSent, handleLimitError } = useMessageLimits()
  const queryClient = useQueryClient()

  const [initialMessages, setInitialMessages] = useState<MyUIMessage[]>([])
  const [chatReady, setChatReady] = useState(false)
  const [projectData, setProjectData] = useState<{
    rootChatId: string
    phaseChats: Array<{
      id: string
      title: string | null
      phase: 'REQUIREMENT' | null
      createdAt: string
      messages: MyUIMessage[]
    }>
    currentPhase: 'REQUIREMENT' | null
  } | null>(null)

  // Calculate the actual chat ID to use for API calls
  const actualChatId = useMemo(() => {
    if (!projectData) return chatId

    // Find the current phase chat
    const currentPhaseChat = projectData.phaseChats.find((pc) => pc.phase === projectData.currentPhase)
    return currentPhaseChat?.id || chatId
  }, [projectData, chatId])

  const { messages, sendMessage, status, stop, setMessages } = useChat<MyUIMessage>({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `/api/chats/${actualChatId}`,
      headers: () => ({
        Authorization: `Bearer ${useAuthStore.getState().token}`,
      }),
    }),
    onFinish: () => {
      handleMessageSent()
      // Delay version refresh to ensure server-side save completes
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['versions', actualChatId] })
      }, 500)
    },
    onError: (error) => {
      const isLimitError = handleLimitError(error)
      if (!isLimitError) {
        console.error('Chat error:', error)
      }
    },
  })

  // Rollback function - rollback to a specific message and delete all messages after it
  const handleRollback = async (messageId: string) => {
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex === -1) return

    // Get messages up to and including the target message
    const rollbackMessages = messages.slice(0, messageIndex + 1)

    // Get messages that will be deleted
    const deletedMessages = messages.slice(messageIndex + 1)

    // Check if we're deleting the final requirement or any generated documents
    const deletedFinalRequirement = deletedMessages.some(
      (msg) => msg.metadata?.isVersionSnapshot === true && msg.metadata?.versionType === 'final'
    )
    const deletedGeneratedDocuments = deletedMessages.some(
      (msg) => msg.metadata?.documentType && msg.metadata.documentType !== 'REQUIREMENT'
    )

    // Reset auto-generation flag if we deleted final requirement or generated documents
    if (deletedFinalRequirement || deletedGeneratedDocuments) {
      hasTriggeredAutoGeneration.current = false
      // Force a generation check after state updates
      setTimeout(() => {
        setForceCheckGeneration((prev) => prev + 1)
      }, 100)
    }

    // Update the last message if it's an assistant message - set answered to false
    const updatedMessages = rollbackMessages.map((msg, index) => {
      if (index === rollbackMessages.length - 1 && msg.role === 'assistant') {
        return {
          ...msg,
          metadata: {
            ...msg.metadata,
            answered: false,
            selectedOptions: [],
            inputValue: '',
            answeredAt: msg.metadata?.answeredAt || new Date().toISOString(),
          },
        }
      }
      return msg
    }) as MyUIMessage[]

    // Update messages state
    setMessages(updatedMessages)

    // Save rollback to server immediately to sync versions
    try {
      await apiClient.post(`/api/chats/${actualChatId}/messages`, {
        messages: updatedMessages,
      })

      // Refresh version list after rollback
      queryClient.invalidateQueries({ queryKey: ['versions', actualChatId] })
    } catch (error) {
      console.error('Failed to save rollback:', error)
    }
  }

  // Simple regenerate function - resend last user message (kept for retry button)
  const handleRetry = () => {
    if (!chatReady || status !== 'ready') {
      console.warn('Chat not ready for retry')
      return
    }
    const lastUserMessage = messages.findLast((m) => m.role === 'user')
    if (lastUserMessage) {
      sendMessage({ text: lastUserMessage.parts.find((p) => p.type === 'text')?.text || '' })
    }
  }

  const [showRequirementSidebar, setShowRequirementSidebar] = useState(false)
  const [userClosedSidebar, setUserClosedSidebar] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAutoSent, setHasAutoSent] = useState(false)
  const [quotes, setQuotes] = useState<Array<{ id: string; text: string }>>([])
  const [chatData, setChatData] = useState<{ isPublic: boolean } | null>(null)
  const [draftActiveTab, setDraftActiveTab] = useState('documents')
  const [sidebarStateBeforeCollapse, setSidebarStateBeforeCollapse] = useState<boolean | null>(null)
  const [windowWidth, setWindowWidth] = useState(0)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [competitorRefreshTrigger, setCompetitorRefreshTrigger] = useState(0)
  const [isGeneratingDocuments, setIsGeneratingDocuments] = useState(false)
  const [forceCheckGeneration, setForceCheckGeneration] = useState(0)
  const hasTriggeredAutoGeneration = useRef(false)
  const prevSidebarOpenRef = useRef<boolean | null>(null)
  const autoCollapsedRef = useRef(false)
  const userManuallyOpenedRef = useRef(false)
  const messageRefs = useRef<Map<string, HTMLElement>>(new Map())

  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar()

  useEffect(() => {
    const loadChat = async () => {
      try {
        const response = await apiClient.get(`/api/chats/${chatId}`)
        if (response.status !== 200) {
          if (response.status === 404) {
            notFound()
          }
          throw new Error('Failed to load chat')
        }

        const chatData = response.data

        // Check if this is a root chat (project container)
        if (chatData.parentId === null && chatData.phase === null) {
          // This is a project root, load project data
          const phaseChatsRes = await apiClient.get(`/api/projects/${chatId}/chats`)

          const phaseChats: Array<{
            id: string
            title: string | null
            phase: 'REQUIREMENT' | null
            createdAt: string
            messages: MyUIMessage[]
          }> = phaseChatsRes.data

          // Try to restore the last viewed phase from localStorage
          const savedPhase = localStorage.getItem(`lastPhase_${chatId}`) as 'REQUIREMENT' | null

          // Find the active chat: either saved phase or the last one
          let activeChat = phaseChats[phaseChats.length - 1]
          if (savedPhase) {
            const savedPhaseChat = phaseChats.find((pc) => pc.phase === savedPhase)
            if (savedPhaseChat) {
              activeChat = savedPhaseChat
            }
          }

          setProjectData({
            rootChatId: chatId,
            phaseChats,
            currentPhase: activeChat?.phase || null,
          })

          // Load active chat messages - use setInitialMessages for proper initialization
          if (activeChat?.messages && activeChat.messages.length > 0) {
            setInitialMessages(activeChat.messages)
            setMessages(activeChat.messages)
          }
        } else {
          // Regular chat, load messages directly - use setInitialMessages for proper initialization
          if (chatData.messages && chatData.messages.length > 0) {
            setInitialMessages(chatData.messages)
            setMessages(chatData.messages)
          }
        }

        setChatData(chatData)
        setIsLoading(false)
        setChatReady(true)
      } catch (error) {
        console.error('Failed to load chat:', error)
        notFound()
      }
    }

    if (chatId) {
      setChatReady(false)
      setPendingMessage(null)
      loadChat()
    }
  }, [chatId])

  // Auto-send pending message when status is ready and chat is initialized
  useEffect(() => {
    if (pendingMessage && status === 'ready' && chatReady) {
      sendMessage({ text: pendingMessage })
      setPendingMessage(null)
    }
  }, [pendingMessage, status, chatReady, sendMessage])

  // Auto-send initial message if provided in URL
  useEffect(() => {
    if (initialMessage && !hasAutoSent && !isLoading && status === 'ready' && chatReady) {
      sendMessage({ text: initialMessage })
      setHasAutoSent(true)

      // Clear the message from URL without page reload
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [initialMessage, hasAutoSent, isLoading, status, chatReady, sendMessage])

  // Filter empty assistant messages
  const filteredMessages = messages.filter((message) => {
    if (message.role === 'assistant') {
      const hasContent = message.parts.some((part) => part.type === 'text' && part.text.trim().length > 0)
      return hasContent
    }
    return true
  })

  // Extract all document content from messages
  const extractContent = (msgs: MyUIMessage[]) => {
    return msgs.reduce(
      (acc, message) => {
        if (message.role === 'assistant') {
          message.parts.forEach((part) => {
            if (part.type === 'text') {
              const parsed = parseAIResponse(part.text)

              if (parsed.final) acc.final = parsed.final
              if (parsed.draft) acc.draft = parsed.draft
              if (parsed.productDocument) acc.productDocument = parsed.productDocument
              if (parsed.flowchart) acc.flowchart = parsed.flowchart
              if (parsed.sitemap) acc.sitemap = parsed.sitemap
              if (parsed.wireframe) acc.wireframe = parsed.wireframe
            }
          })
        }
        return acc
      },
      {
        draft: undefined as string | undefined,
        final: undefined as string | undefined,
        productDocument: undefined as string | undefined,
        flowchart: undefined as string | undefined,
        sitemap: undefined as string | undefined,
        wireframe: undefined as string | undefined,
      }
    )
  }

  // Calculate live content for all document types
  const phaseLiveContent = useMemo(() => {
    if (!projectData) {
      return {
        requirement: { draft: undefined, final: undefined },
        productDocument: undefined,
        flowchart: undefined,
        sitemap: undefined,
        wireframe: undefined,
      }
    }

    // Extract content from current phase chat's messages
    const currentPhaseChat = projectData.phaseChats.find((pc) => pc.phase === projectData.currentPhase)
    const messagesToProcess = currentPhaseChat ? messages : []

    const allContent = extractContent(messagesToProcess)

    return {
      requirement: { draft: allContent.draft, final: allContent.final },
      productDocument: allContent.productDocument,
      flowchart: allContent.flowchart,
      sitemap: allContent.sitemap,
      wireframe: allContent.wireframe,
    }
  }, [projectData, messages])

  // Find the last final requirement message for document generation
  // Use <final> tag detection instead of metadata since backend might not set it correctly
  const lastRequirementMessageId = useMemo(() => {
    const messagesWithFinalTag = filteredMessages.filter((m) => {
      if (m.role !== 'assistant') return false
      const textPart = m.parts.find((p) => p.type === 'text')
      return textPart && textPart.text && textPart.text.includes('<final>')
    })

    return messagesWithFinalTag.length > 0 ? messagesWithFinalTag[messagesWithFinalTag.length - 1].id : undefined
  }, [filteredMessages])

  // Check if documents have been generated
  const hasGeneratedDocuments = useMemo(() => {
    return filteredMessages.some((m) => m.metadata?.documentType && m.metadata.documentType !== 'REQUIREMENT')
  }, [filteredMessages])

  // Get the last requirement document ID for progress tracking
  const projectIdForRequirement = projectData?.rootChatId || chatId
  const { data: latestRequirementData } = useLatestRequirement(projectIdForRequirement)
  const lastRequirementDocId = latestRequirementData?.requirementDoc?.id || null

  // Debug logging for requirement detection
  useEffect(() => {
    console.log('[Chat:Progress] Project ID:', projectIdForRequirement)
    console.log('[Chat:Progress] Latest requirement data:', latestRequirementData)
    console.log('[Chat:Progress] Last requirement doc ID:', lastRequirementDocId)
  }, [projectIdForRequirement, latestRequirementData, lastRequirementDocId])

  // Auto show draft panel when there's content (but respect user's manual close)
  useEffect(() => {
    const hasLiveContent = !!(phaseLiveContent.requirement.draft || phaseLiveContent.requirement.final)

    if (hasLiveContent && !showRequirementSidebar && !userClosedSidebar) {
      setShowRequirementSidebar(true)
    }
  }, [phaseLiveContent, showRequirementSidebar, userClosedSidebar])

  // Auto-generate documents when final requirement is completed
  useEffect(() => {
    const autoGenerateDocuments = async () => {
      if (
        !lastRequirementMessageId ||
        hasGeneratedDocuments ||
        hasTriggeredAutoGeneration.current ||
        isGeneratingDocuments ||
        status !== 'ready'
      ) {
        return
      }

      hasTriggeredAutoGeneration.current = true
      setIsGeneratingDocuments(true)

      // Show draft panel immediately when generation starts
      setDraftActiveTab('documents')
      setShowRequirementSidebar(true)
      setUserClosedSidebar(false)

      try {
        const response = await apiClient.post(
          `/api/chats/${actualChatId}/generate-documents`,
          {
            requirementMessageId: lastRequirementMessageId,
          },
          {
            timeout: 120000,
          }
        )

        if (response.status === 200) {
          // Refresh messages to load new document messages
          queryClient.invalidateQueries({ queryKey: ['versions', actualChatId] })
          window.location.reload()
        }
      } catch (error) {
        console.error('Failed to auto-generate documents:', error)
        hasTriggeredAutoGeneration.current = false
      } finally {
        setIsGeneratingDocuments(false)
      }
    }

    autoGenerateDocuments()
  }, [
    lastRequirementMessageId,
    hasGeneratedDocuments,
    isGeneratingDocuments,
    status,
    actualChatId,
    queryClient,
    forceCheckGeneration,
  ])

  // Reset auto-generation flag when switching chats
  useEffect(() => {
    hasTriggeredAutoGeneration.current = false
  }, [chatId])

  // Monitor window width
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Reset manual flag when switching chats
  useEffect(() => {
    userManuallyOpenedRef.current = false
    setSidebarStateBeforeCollapse(null)
    autoCollapsedRef.current = false
    prevSidebarOpenRef.current = null
  }, [chatId])

  // Detect user manual sidebar operations
  useEffect(() => {
    const prevOpen = prevSidebarOpenRef.current

    if (prevOpen === false && sidebarOpen === true && autoCollapsedRef.current) {
      userManuallyOpenedRef.current = true
      if (sidebarStateBeforeCollapse !== null) {
        setSidebarStateBeforeCollapse(null)
      }
    } else if (prevOpen === true && sidebarOpen === false && userManuallyOpenedRef.current) {
      userManuallyOpenedRef.current = false
      if (sidebarStateBeforeCollapse !== null) {
        setSidebarStateBeforeCollapse(null)
      }
    }

    prevSidebarOpenRef.current = sidebarOpen
  }, [sidebarOpen, sidebarStateBeforeCollapse])

  // Auto-collapse sidebar based on available space
  useEffect(() => {
    if (windowWidth === 0) return
    if (userManuallyOpenedRef.current) return

    const SIDEBAR_WIDTH = 256
    let DRAFT_PANEL_WIDTH = 0

    if (showRequirementSidebar) {
      if (draftActiveTab === 'documents') {
        DRAFT_PANEL_WIDTH = Math.min(windowWidth * 0.4, 600)
      } else {
        DRAFT_PANEL_WIDTH = Math.min(windowWidth * 0.65, 1200)
      }
    }

    const MIN_CHAT_WIDTH = 600
    const availableWidth = sidebarOpen
      ? windowWidth - SIDEBAR_WIDTH - DRAFT_PANEL_WIDTH
      : windowWidth - DRAFT_PANEL_WIDTH
    const shouldCollapseSidebar = availableWidth < MIN_CHAT_WIDTH && sidebarOpen
    const hasSpaceConstraint = windowWidth - SIDEBAR_WIDTH - DRAFT_PANEL_WIDTH < MIN_CHAT_WIDTH

    if (shouldCollapseSidebar) {
      if (sidebarStateBeforeCollapse === null) {
        setSidebarStateBeforeCollapse(true)
      }
      autoCollapsedRef.current = true
      setSidebarOpen(false)
    } else if (!shouldCollapseSidebar && sidebarStateBeforeCollapse !== null) {
      if (windowWidth - SIDEBAR_WIDTH - DRAFT_PANEL_WIDTH >= MIN_CHAT_WIDTH) {
        autoCollapsedRef.current = false
        setSidebarOpen(sidebarStateBeforeCollapse)
        setSidebarStateBeforeCollapse(null)
      }
    } else if (hasSpaceConstraint && !sidebarOpen) {
      autoCollapsedRef.current = true
    } else if (!hasSpaceConstraint && !sidebarOpen) {
      autoCollapsedRef.current = false
    }
  }, [windowWidth, showRequirementSidebar, draftActiveTab, sidebarOpen, sidebarStateBeforeCollapse, setSidebarOpen])

  // Auto-save messages before page unload (refresh, close, navigate away)
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (!projectData || messages.length === 0) return

      const currentPhaseChat = projectData.phaseChats.find((pc) => pc.phase === projectData.currentPhase)
      if (currentPhaseChat) {
        try {
          // Use sendBeacon for better reliability on page unload
          const blob = new Blob([JSON.stringify({ messages })], { type: 'application/json' })
          navigator.sendBeacon(`/api/chats/${currentPhaseChat.id}/messages`, blob)
        } catch (error) {
          console.error('Failed to save messages on unload:', error)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [projectData, messages])

  const cleanupEmptyAssistantMessage = () => {
    if (messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role === 'assistant') {
      const hasContent = lastMessage.parts.some((part) => part.type === 'text' && part.text.trim().length > 0)
      if (!hasContent) {
        setMessages((prev) => prev.slice(0, -1))
      }
    }
  }

  useEffect(() => {
    if (status === 'error') {
      setTimeout(() => cleanupEmptyAssistantMessage(), 100)
    }
  }, [status])

  const handleStop = () => {
    stop()
    setTimeout(() => cleanupEmptyAssistantMessage(), 100)
  }

  const handleQuote = (selectedText: string) => {
    const newQuote = {
      id: Date.now().toString(),
      text: selectedText.trim(),
    }
    setQuotes((prev) => [...prev, newQuote])
  }

  const handleRemoveQuote = (id: string) => {
    setQuotes((prev) => prev.filter((quote) => quote.id !== id))
  }

  const handleSendMessage = (message: { text: string }) => {
    if (!chatReady || status !== 'ready') {
      console.warn('Chat not ready, message queued')
      return
    }
    setQuotes([])
    sendMessage(message)
  }

  const handleUpdateMessage = (messageId: string, metadata: MyUIMessage['metadata']) => {
    setMessages(
      (prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, metadata: { ...msg.metadata, ...metadata } } : msg
        ) as MyUIMessage[]
    )
  }

  const handleMarkMessageAnswered = (messageId: string, selectedOptions: SelectedOption[]) => {
    setMessages(
      (prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                metadata: {
                  ...msg.metadata,
                  answered: true,
                  selectedOptions: selectedOptions.map((opt) => opt.value),
                  answeredAt: new Date().toISOString(),
                },
              }
            : msg
        ) as MyUIMessage[]
    )
  }

  const handlePublicChange = (isPublic: boolean) => {
    setChatData((prev) => (prev ? { ...prev, isPublic } : null))
  }

  // No phase switching logic needed - single phase only

  const handleScrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current.get(messageId)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Add highlight effect
      messageElement.classList.add('highlight-version-message')
      setTimeout(() => {
        messageElement.classList.remove('highlight-version-message')
      }, 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-1.5rem)] flex-col overflow-hidden">
        <PageHeader title="Chat" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading chat...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-1.5rem)] flex-col overflow-hidden">
      <PageHeader
        title="Chat"
        actions={
          chatData && <PublicButton chatId={chatId} isPublic={chatData.isPublic} onPublicChange={handlePublicChange} />
        }
      />

      <div className="flex flex-1 items-stretch overflow-hidden">
        {/* Left side: Phase Progress + Chat Area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden" data-chat-area>
          <div
            className={`flex h-full flex-col overflow-hidden transition-all duration-700 ease-in-out ${
              showRequirementSidebar ? 'mx-0' : 'mx-auto w-full max-w-4xl'
            }`}>
            <MessageList
              messages={filteredMessages}
              status={status}
              onRetry={handleRetry}
              onSendMessage={sendMessage}
              onUpdateMessage={handleUpdateMessage}
              onRollback={handleRollback}
              messageRefs={messageRefs}
            />

            {lastRequirementDocId && (
              <div className="mb-4 px-4">
                <GenerationProgress
                  requirementDocId={lastRequirementDocId}
                  onComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ['documents'] })
                  }}
                />
              </div>
            )}

            <ChatInput
              onSendMessage={handleSendMessage}
              onMarkMessageAnswered={handleMarkMessageAnswered}
              onStop={handleStop}
              status={status}
              quotes={quotes}
              onRemoveQuote={handleRemoveQuote}
              chatId={actualChatId}
              phase={projectData?.currentPhase || null}
              onCompetitorSearchComplete={() => {
                setDraftActiveTab('competitors')
                setShowRequirementSidebar(true)
                setCompetitorRefreshTrigger((prev) => prev + 1)
              }}
            />
          </div>
        </div>

        {/* Right side: DraftPanel */}
        <DraftPanel
          isVisible={showRequirementSidebar}
          onToggle={() => {
            const newState = !showRequirementSidebar
            setShowRequirementSidebar(newState)
            // If user is closing the sidebar, mark it as manually closed
            if (!newState) {
              setUserClosedSidebar(true)
            } else {
              // If user is opening it, reset the flag
              setUserClosedSidebar(false)
            }
          }}
          onQuote={handleQuote}
          chatId={projectData?.rootChatId || chatId}
          currentPhaseChatId={actualChatId}
          activeTab={draftActiveTab}
          onActiveTabChange={setDraftActiveTab}
          currentPhase={projectData?.currentPhase}
          liveContent={phaseLiveContent}
          competitorRefreshTrigger={competitorRefreshTrigger}
          onScrollToMessage={handleScrollToMessage}
          isGeneratingDocuments={isGeneratingDocuments}
        />
      </div>
    </div>
  )
}
