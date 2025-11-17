'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import dynamicImport from 'next/dynamic'
import { useParams, useSearchParams, notFound } from 'next/navigation'
import { useState, useEffect, useRef, useMemo } from 'react'

import { ChatInput } from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/message-list'
import { PublicButton } from '@/components/chat/public-button'
import { PageHeader } from '@/components/page-header'
import { CodeGenerationButton } from '@/components/project/code-generation-button'
import { NextPhaseButton } from '@/components/project/next-phase-button'
import { PhaseProgress } from '@/components/project/phase-progress'
import { useSidebar } from '@/components/ui/sidebar'

const DraftPanel = dynamicImport(
  () => import('@/components/chat/draft-panel').then((mod) => ({ default: mod.DraftPanel })),
  {
    ssr: false,
  }
)

export const dynamic = 'force-dynamic'

import { useMessageLimits } from '@/hooks/use-message-limits'
import { SelectedOption } from '@/hooks/use-selected-options'
import { parseAIResponse } from '@/libs/ai/xml-parser'
import apiClient from '@/libs/utils/axios'
import { MyUIMessage } from '@/schema/chat'
import { useAuthStore } from '@/store/auth-store'

export default function ChatIdPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const chatId = params.chatId as string
  const initialMessage = searchParams.get('message')
  const { handleMessageSent, handleLimitError } = useMessageLimits()

  const [initialMessages, setInitialMessages] = useState<MyUIMessage[]>([])
  const [chatReady, setChatReady] = useState(false)
  const [projectData, setProjectData] = useState<{
    rootChatId: string
    phaseChats: Array<{
      id: string
      title: string | null
      phase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT' | null
      createdAt: string
      messages: MyUIMessage[]
    }>
    currentPhase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT' | null
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
    },
    onError: (error) => {
      const isLimitError = handleLimitError(error)
      if (!isLimitError) {
        console.error('Chat error:', error)
      }
    },
  })

  // Rollback function - rollback to a specific message and delete all messages after it
  const handleRollback = (messageId: string) => {
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex === -1) return

    // Get messages up to and including the target message
    const rollbackMessages = messages.slice(0, messageIndex + 1)

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
  const [isLoading, setIsLoading] = useState(true)
  const [hasAutoSent, setHasAutoSent] = useState(false)
  const [quotes, setQuotes] = useState<Array<{ id: string; text: string }>>([])
  const [chatData, setChatData] = useState<{ isPublic: boolean } | null>(null)
  const [draftActiveTab, setDraftActiveTab] = useState('documents')
  const [sidebarStateBeforeCollapse, setSidebarStateBeforeCollapse] = useState<boolean | null>(null)
  const [windowWidth, setWindowWidth] = useState(0)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const prevSidebarOpenRef = useRef<boolean | null>(null)
  const autoCollapsedRef = useRef(false)
  const userManuallyOpenedRef = useRef(false)
  const isSwitchingRef = useRef(false)

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
            phase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT' | null
            createdAt: string
            messages: MyUIMessage[]
          }> = phaseChatsRes.data

          // Try to restore the last viewed phase from localStorage
          const savedPhase = localStorage.getItem(`lastPhase_${chatId}`) as
            | 'REQUIREMENT'
            | 'ARCHITECTURE'
            | 'DEVELOPMENT'
            | null

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

  // Extract draft/final content from messages
  const extractContent = (msgs: MyUIMessage[]) => {
    return msgs.reduce(
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
  }

  // Calculate live content for each phase from projectData
  const phaseLiveContent = useMemo(() => {
    if (!projectData) {
      return {
        requirement: { draft: undefined, final: undefined },
        architecture: { draft: undefined, final: undefined },
        development: { draft: undefined, final: undefined },
      }
    }

    const result = {
      requirement: { draft: undefined as string | undefined, final: undefined as string | undefined },
      architecture: { draft: undefined as string | undefined, final: undefined as string | undefined },
      development: { draft: undefined as string | undefined, final: undefined as string | undefined },
    }

    // Extract content from each phase chat's messages
    projectData.phaseChats.forEach((phaseChat) => {
      if (phaseChat.phase === 'REQUIREMENT') {
        result.requirement = extractContent(phaseChat.messages || [])
      } else if (phaseChat.phase === 'ARCHITECTURE') {
        result.architecture = extractContent(phaseChat.messages || [])
      } else if (phaseChat.phase === 'DEVELOPMENT') {
        result.development = extractContent(phaseChat.messages || [])
      }
    })

    return result
  }, [projectData])

  // Auto show draft panel when there's content
  useEffect(() => {
    const hasLiveContent = !!(
      phaseLiveContent.requirement.draft ||
      phaseLiveContent.requirement.final ||
      phaseLiveContent.architecture.draft ||
      phaseLiveContent.architecture.final ||
      phaseLiveContent.development.draft ||
      phaseLiveContent.development.final
    )

    if (hasLiveContent) {
      setShowRequirementSidebar(true)
    }
  }, [phaseLiveContent])

  // Auto-inject requirement document for architecture phase if no messages
  // Note: This only handles initial page load. Phase transitions are handled in handleNextPhaseSuccess
  useEffect(() => {
    if (
      !hasAutoSent &&
      !isLoading &&
      status === 'ready' &&
      chatReady &&
      projectData?.currentPhase === 'ARCHITECTURE' &&
      phaseLiveContent.requirement.final &&
      messages.length === 0 &&
      !pendingMessage // Don't send if there's already a pending message
    ) {
      setHasAutoSent(true)
      setTimeout(() => {
        sendMessage({
          text: `Based on the requirement document below, please help me design the technical architecture:\n\n${phaseLiveContent.requirement.final}`,
        })
      }, 500)
    }
  }, [
    hasAutoSent,
    isLoading,
    status,
    chatReady,
    projectData,
    phaseLiveContent.requirement.final,
    messages.length,
    sendMessage,
    pendingMessage,
  ])

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

  const handlePhaseSwitch = async (phase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT') => {
    if (!projectData) return

    // Prevent duplicate switching
    if (isSwitchingRef.current) {
      console.warn('Phase switch already in progress')
      return
    }

    // Already on this phase
    if (projectData.currentPhase === phase) {
      return
    }

    // Stop streaming if in progress
    if (status !== 'ready') {
      stop()
      cleanupEmptyAssistantMessage()
    }

    // Mark as switching
    isSwitchingRef.current = true

    // Immediately mark as not ready to prevent new messages
    setChatReady(false)

    try {
      // Note: No need to save messages here - they are already saved via onFinish callback
      // Update projectData with current messages saved, then switch
      setProjectData((prev) => {
        if (!prev) return null

        // Create updated phaseChats with current messages saved
        const updatedPhaseChats = prev.phaseChats.map((pc) =>
          pc.phase === prev.currentPhase ? { ...pc, messages } : pc
        )

        // Find target phase chat from updated array
        const targetPhaseChat = updatedPhaseChats.find((pc) => pc.phase === phase)
        if (!targetPhaseChat) {
          console.warn(`Target phase chat not found: ${phase}`)
          isSwitchingRef.current = false
          setChatReady(true)
          return prev
        }

        // Use setTimeout to ensure state updates are batched properly
        setTimeout(() => {
          const newMessages = (targetPhaseChat.messages || []) as MyUIMessage[]
          setInitialMessages(newMessages)
          setMessages(newMessages)

          // Wait longer to ensure useChat internal state is fully synced
          setTimeout(() => {
            setChatReady(true)
            isSwitchingRef.current = false
          }, 100)
        }, 0)

        // Save current phase to localStorage
        localStorage.setItem(`lastPhase_${prev.rootChatId}`, phase)

        return {
          ...prev,
          phaseChats: updatedPhaseChats,
          currentPhase: phase,
        }
      })
    } catch (error) {
      console.error('Failed to save messages before switching:', error)
      // Continue switching even if save failed
      setChatReady(true)
      isSwitchingRef.current = false
    }
  }

  // Calculate phase status based on live content and messages
  const getPhaseStatus = (phase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT') => {
    if (!projectData) return 'pending' as const

    const phaseKey = phase.toLowerCase() as 'requirement' | 'architecture' | 'development'

    // 1. If has final content → completed
    if (phaseLiveContent[phaseKey].final) {
      return 'completed' as const
    }

    // 2. If is current phase → in-progress
    if (projectData.currentPhase === phase) {
      return 'in-progress' as const
    }

    // 3. If phase chat has messages → in-progress (allow switching back)
    const phaseChat = projectData.phaseChats.find((pc) => pc.phase === phase)
    if (phaseChat && phaseChat.messages && phaseChat.messages.length > 0) {
      return 'in-progress' as const
    }

    // 4. Otherwise → pending
    return 'pending' as const
  }

  // Calculate phase progress
  const phaseProgress = projectData
    ? [
        {
          phase: 'REQUIREMENT' as const,
          status: getPhaseStatus('REQUIREMENT'),
        },
        {
          phase: 'ARCHITECTURE' as const,
          status: getPhaseStatus('ARCHITECTURE'),
        },
        {
          phase: 'DEVELOPMENT' as const,
          status: getPhaseStatus('DEVELOPMENT'),
        },
      ]
    : []

  // Check if should show "Start Next Phase" button
  const showNextPhaseButton =
    projectData &&
    ((projectData.currentPhase === 'REQUIREMENT' &&
      phaseLiveContent.requirement.final &&
      !projectData.phaseChats.some((pc) => pc.phase === 'ARCHITECTURE')) ||
      (projectData.currentPhase === 'ARCHITECTURE' &&
        phaseLiveContent.architecture.final &&
        !projectData.phaseChats.some((pc) => pc.phase === 'DEVELOPMENT')))

  // Check if should show "Generate Code" button
  const showCodeGenerationButton =
    projectData &&
    projectData.currentPhase === 'DEVELOPMENT' &&
    phaseLiveContent.requirement.final &&
    phaseLiveContent.architecture.final &&
    phaseLiveContent.development.final

  const handleNextPhaseSuccess = async () => {
    // Reload data instead of full page reload
    try {
      setChatReady(false)
      setHasAutoSent(true) // Mark as sent to prevent duplicate auto-send from useEffect

      const phaseChatsRes = await apiClient.get(`/api/projects/${chatId}/chats`)

      const phaseChats = phaseChatsRes.data

      const activeChat = phaseChats[phaseChats.length - 1]

      setProjectData({
        rootChatId: chatId,
        phaseChats,
        currentPhase: activeChat?.phase || null,
      })

      // Use setTimeout to ensure state updates are batched properly
      setTimeout(() => {
        // Load new active chat messages - use both setInitialMessages and setMessages
        const hasExistingMessages = activeChat?.messages && activeChat.messages.length > 0
        if (hasExistingMessages) {
          setInitialMessages(activeChat.messages)
          setMessages(activeChat.messages)
        } else {
          setInitialMessages([])
          setMessages([])
        }

        // Auto-open draft panel - pending message will be handled by useEffect
        setShowRequirementSidebar(true)

        // Wait a bit before marking ready to ensure useChat internal state is updated
        setTimeout(() => {
          setChatReady(true)
        }, 50)
      }, 0)
    } catch (error) {
      console.error('Failed to reload project data:', error)
      setChatReady(true)
    }
  }

  const handleCodeGenerationSuccess = async () => {
    // Reload project data to update UI (without full page reload)
    try {
      const [phaseChatsRes, documentsRes] = await Promise.all([
        apiClient.get(`/api/projects/${chatId}/chats`),
        apiClient.get(`/api/projects/${chatId}/documents`),
      ])

      const phaseChats = phaseChatsRes.data
      const documentsData = documentsRes.data

      // Transform documents: convert null to undefined
      const documents = {
        ...(documentsData.requirement && { requirement: documentsData.requirement }),
        ...(documentsData.architecture && { architecture: documentsData.architecture }),
        ...(documentsData.development && { development: documentsData.development }),
      }

      setProjectData((prev) => {
        if (!prev) return null
        return {
          ...prev,
          phaseChats,
          documents,
        }
      })

      // Auto switch to Preview tab after successful generation
      setDraftActiveTab('preview')
      // Ensure the sidebar is open
      setShowRequirementSidebar(true)
    } catch (error) {
      console.error('Failed to reload project data:', error)
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
          {/* Phase Progress Bar */}
          {projectData && (
            <PhaseProgress
              phases={phaseProgress}
              currentPhase={projectData.currentPhase}
              onPhaseClick={handlePhaseSwitch}
              clickable={true}
            />
          )}

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
            />

            {/* Next Phase Button */}
            {showNextPhaseButton && projectData!.currentPhase !== 'DEVELOPMENT' && (
              <div className="mx-auto max-w-3xl px-4 pb-4">
                <NextPhaseButton
                  rootChatId={projectData!.rootChatId}
                  currentPhase={projectData!.currentPhase!}
                  onSuccess={handleNextPhaseSuccess}
                />
              </div>
            )}

            {/* Code Generation Button */}
            {showCodeGenerationButton && (
              <div className="mx-auto max-w-3xl px-4 pb-4">
                <CodeGenerationButton
                  documents={{
                    ...(phaseLiveContent.requirement.final && {
                      requirement: { content: phaseLiveContent.requirement.final },
                    }),
                    ...(phaseLiveContent.architecture.final && {
                      architecture: { content: phaseLiveContent.architecture.final },
                    }),
                    ...(phaseLiveContent.development.final && {
                      development: { content: phaseLiveContent.development.final },
                    }),
                  }}
                  rootChatId={projectData!.rootChatId}
                  onSuccess={handleCodeGenerationSuccess}
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
            />
          </div>
        </div>

        {/* Right side: DraftPanel */}
        <DraftPanel
          isVisible={showRequirementSidebar}
          onToggle={() => setShowRequirementSidebar(!showRequirementSidebar)}
          onQuote={handleQuote}
          chatId={projectData?.rootChatId || chatId}
          activeTab={draftActiveTab}
          onActiveTabChange={setDraftActiveTab}
          currentPhase={projectData?.currentPhase}
          liveContent={phaseLiveContent}
        />
      </div>
    </div>
  )
}
