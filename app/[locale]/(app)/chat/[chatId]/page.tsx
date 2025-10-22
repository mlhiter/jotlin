'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import dynamic from 'next/dynamic'
import { useParams, useSearchParams, notFound } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'

import { ChatInput } from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/message-list'
import { PublicButton } from '@/components/chat/public-button'
import { PageHeader } from '@/components/page-header'
import { CodeGenerationButton } from '@/components/project/code-generation-button'
import { NextPhaseButton } from '@/components/project/next-phase-button'
import { PhaseProgress } from '@/components/project/phase-progress'
import { useSidebar } from '@/components/ui/sidebar'

const DraftPanel = dynamic(() => import('@/components/chat/draft-panel').then((mod) => ({ default: mod.DraftPanel })), {
  ssr: false,
})

import { useMessageLimits } from '@/hooks/use-message-limits'
import { SelectedOption } from '@/hooks/use-selected-options'
import { parseAIResponse } from '@/libs/ai/xml-parser'
import apiClient from '@/libs/utils/axios'
import { MyUIMessage } from '@/schema/chat'
import { useAuthStore } from '@/store/auth-store'

export default function ChatIdPage() {
  const t = useTranslations('chat')
  const params = useParams()
  const searchParams = useSearchParams()
  const chatId = params.chatId as string
  const initialMessage = searchParams.get('message')
  const { handleMessageSent, handleLimitError } = useMessageLimits()

  // TODO: we need messages
  const { messages, sendMessage, status, stop, setMessages } = useChat<MyUIMessage>({
    id: chatId,
    messages: [],
    transport: new DefaultChatTransport({
      api: `/api/chats/${chatId}`,
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
  const [projectData, setProjectData] = useState<{
    rootChatId: string
    phaseChats: Array<{
      id: string
      title: string | null
      phase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT' | null
      createdAt: string
      messages: Array<{
        id: string
        role: string
        parts: unknown
        createdAt: string
      }>
    }>
    documents: {
      requirement?: { id: string; content: string; status: string }
      architecture?: { id: string; content: string; status: string }
      development?: { id: string; content: string; status: string }
    }
    currentPhase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT' | null
  } | null>(null)

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
          const [phaseChatsRes, documentsRes] = await Promise.all([
            apiClient.get(`/api/projects/${chatId}/chats`),
            apiClient.get(`/api/projects/${chatId}/documents`),
          ])

          const phaseChats = phaseChatsRes.data
          const documentsData = documentsRes.data

          // Find the currently active phase chat (the last one)
          const activeChat = phaseChats[phaseChats.length - 1]

          // Transform documents: convert null to undefined
          const documents = {
            ...(documentsData.requirement && { requirement: documentsData.requirement }),
            ...(documentsData.architecture && { architecture: documentsData.architecture }),
            ...(documentsData.development && { development: documentsData.development }),
          }

          setProjectData({
            rootChatId: chatId,
            phaseChats,
            documents,
            currentPhase: activeChat?.phase || null,
          })

          // Load active chat messages
          if (activeChat?.messages && activeChat.messages.length > 0) {
            setMessages(activeChat.messages)
          }
        } else {
          // Regular chat, load messages directly
          if (chatData.messages && chatData.messages.length > 0) {
            setMessages(chatData.messages)
          }
        }

        setChatData(chatData)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load chat:', error)
        notFound()
      }
    }

    if (chatId) {
      loadChat()
    }
  }, [chatId])

  // Auto-send initial message if provided in URL
  useEffect(() => {
    if (initialMessage && !hasAutoSent && !isLoading && status === 'ready') {
      sendMessage({ text: initialMessage })
      setHasAutoSent(true)

      // Clear the message from URL without page reload
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [initialMessage, hasAutoSent, isLoading, status, sendMessage])

  // Auto-inject requirement document for architecture phase if no messages
  useEffect(() => {
    if (
      !hasAutoSent &&
      !isLoading &&
      status === 'ready' &&
      projectData?.currentPhase === 'ARCHITECTURE' &&
      projectData?.documents?.requirement &&
      messages.length === 0
    ) {
      setHasAutoSent(true)
      setTimeout(() => {
        sendMessage({
          text: `Based on the requirement document below, please help me design the technical architecture:\n\n${projectData.documents.requirement!.content}`,
        })
      }, 500)
    }
  }, [hasAutoSent, isLoading, status, projectData, messages.length, sendMessage])

  // Filter empty assistant messages
  const filteredMessages = messages.filter((message) => {
    if (message.role === 'assistant') {
      const hasContent = message.parts.some((part) => part.type === 'text' && part.text.trim().length > 0)
      return hasContent
    }
    return true
  })

  // Check if any message has draft or final content
  const requirementContent = filteredMessages.reduce(
    (acc, message) => {
      if (message.role === 'assistant') {
        message.parts.forEach((part) => {
          if (part.type === 'text') {
            const parsed = parseAIResponse(part.text)
            if (parsed.draft || parsed.final) {
              acc = { draft: parsed.draft, final: parsed.final }
            }
          }
        })
      }
      return acc
    },
    { draft: undefined as string | undefined, final: undefined as string | undefined }
  )

  // Auto-save document when final content is detected
  useEffect(() => {
    const cleanDocumentContent = (content: string): string => {
      // Remove any XML tags that might have leaked through
      let cleaned = content
        .replace(/<\/?response>/gi, '')
        .replace(/<\/?prose>/gi, '')
        .replace(/<\/?question>/gi, '')
        .replace(/<\/?options[^>]*>/gi, '')
        .replace(/<\/?option[^>]*>/gi, '')
        .replace(/<\/?draft>/gi, '')
        .replace(/<\/?final>/gi, '')
        .replace(/<\/?input[^>]*>/gi, '')
        .trim()

      // Find the first Markdown heading (# ) and start from there
      // This removes any explanatory text before the actual document
      const headingMatch = cleaned.match(/^([\s\S]*?)(#\s+.+)$/m)
      if (headingMatch && headingMatch[1].trim().length > 0) {
        cleaned = headingMatch[2]
      }

      return cleaned.trim()
    }

    const saveDocument = async () => {
      if (!requirementContent.final || !projectData?.currentPhase || !projectData?.rootChatId) {
        return
      }

      // Clean the content before saving
      const cleanedContent = cleanDocumentContent(requirementContent.final)

      // Check if this document is already saved
      const phaseKey = projectData.currentPhase.toLowerCase() as 'requirement' | 'architecture' | 'development'
      const existingDoc = projectData.documents[phaseKey]
      if (existingDoc && existingDoc.content === cleanedContent) {
        return
      }

      try {
        await apiClient.post(`/api/projects/${projectData.rootChatId}/documents`, {
          phase: projectData.currentPhase,
          content: cleanedContent,
          sourceChatId: chatId,
        })

        // Reload documents
        const documentsRes = await apiClient.get(`/api/projects/${projectData.rootChatId}/documents`)
        setProjectData((prev) => (prev ? { ...prev, documents: documentsRes.data } : null))
      } catch (error) {
        console.error('Failed to save document:', error)
      }
    }

    saveDocument()
  }, [requirementContent.final, projectData?.currentPhase, projectData?.rootChatId, chatId])

  // Auto show draft panel when there's content
  useEffect(() => {
    const hasContent =
      requirementContent.draft ||
      requirementContent.final ||
      projectData?.documents?.requirement ||
      projectData?.documents?.architecture

    if (hasContent) {
      setShowRequirementSidebar(true)
    }
  }, [requirementContent.draft, requirementContent.final, projectData?.documents])

  // Auto-collapse sidebar when viewing code/preview on smaller screens
  useEffect(() => {
    const shouldCollapseSidebar = (draftActiveTab === 'preview' || draftActiveTab === 'code') && showRequirementSidebar

    if (shouldCollapseSidebar && typeof window !== 'undefined' && window.innerWidth < 1440) {
      if (sidebarStateBeforeCollapse === null) {
        setSidebarStateBeforeCollapse(sidebarOpen)
      }
      setSidebarOpen(false)
    } else if (!shouldCollapseSidebar && sidebarStateBeforeCollapse !== null) {
      setSidebarOpen(sidebarStateBeforeCollapse)
      setSidebarStateBeforeCollapse(null)
    }
  }, [draftActiveTab, showRequirementSidebar, sidebarOpen, sidebarStateBeforeCollapse, setSidebarOpen])

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

  // Calculate phase progress
  const phaseProgress = projectData
    ? [
        {
          phase: 'REQUIREMENT' as const,
          status: projectData.documents.requirement
            ? ('completed' as const)
            : projectData.currentPhase === 'REQUIREMENT'
              ? ('in-progress' as const)
              : ('pending' as const),
        },
        {
          phase: 'ARCHITECTURE' as const,
          status: projectData.documents.architecture
            ? ('completed' as const)
            : projectData.currentPhase === 'ARCHITECTURE'
              ? ('in-progress' as const)
              : ('pending' as const),
        },
        {
          phase: 'DEVELOPMENT' as const,
          status: projectData.documents.development
            ? ('completed' as const)
            : projectData.currentPhase === 'DEVELOPMENT'
              ? ('in-progress' as const)
              : ('pending' as const),
        },
      ]
    : []

  // Check if should show "Start Next Phase" button
  const showNextPhaseButton =
    projectData &&
    requirementContent.final &&
    ((projectData.currentPhase === 'REQUIREMENT' && !projectData.documents.architecture) ||
      (projectData.currentPhase === 'ARCHITECTURE' && !projectData.documents.development))

  // Check if should show "Generate Code" button
  const showCodeGenerationButton =
    projectData &&
    projectData.currentPhase === 'DEVELOPMENT' &&
    projectData.documents.requirement &&
    projectData.documents.architecture &&
    projectData.documents.development

  const handleNextPhaseSuccess = async () => {
    // Reload data instead of full page reload
    try {
      const [phaseChatsRes, documentsRes] = await Promise.all([
        apiClient.get(`/api/projects/${chatId}/chats`),
        apiClient.get(`/api/projects/${chatId}/documents`),
      ])

      const phaseChats = phaseChatsRes.data
      const documentsData = documentsRes.data

      const activeChat = phaseChats[phaseChats.length - 1]

      // Transform documents: convert null to undefined
      const documents = {
        ...(documentsData.requirement && { requirement: documentsData.requirement }),
        ...(documentsData.architecture && { architecture: documentsData.architecture }),
        ...(documentsData.development && { development: documentsData.development }),
      }

      setProjectData({
        rootChatId: chatId,
        phaseChats,
        documents,
        currentPhase: activeChat?.phase || null,
      })

      // Load new active chat messages
      if (activeChat?.messages && activeChat.messages.length > 0) {
        setMessages(activeChat.messages)
      } else {
        setMessages([])
      }

      // Auto-send initial message with previous phase document(s)
      if (activeChat && activeChat.phase === 'ARCHITECTURE' && documents.requirement) {
        setTimeout(() => {
          sendMessage({
            text: `Based on the requirement document below, please help me design the technical architecture:\n\n${documents.requirement.content}`,
          })
        }, 500)
      } else if (activeChat && activeChat.phase === 'DEVELOPMENT' && documents.requirement && documents.architecture) {
        setTimeout(() => {
          sendMessage({
            text: `Based on the following documents, please generate a development plan:\n\n【Requirements Analysis Document】\n${documents.requirement.content}\n\n【Technical Architecture Document】\n${documents.architecture.content}`,
          })
        }, 500)
      }

      // Auto-open draft panel if there's content
      if (documents.requirement || documents.architecture) {
        setShowRequirementSidebar(true)
      }
    } catch (error) {
      console.error('Failed to reload project data:', error)
    }
  }

  const handleCodeGenerationSuccess = () => {
    // Reload project data to update UI
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3rem)] flex-col overflow-hidden">
        <PageHeader title={t('title')} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">{t('loadingChat')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col overflow-hidden">
      <PageHeader
        title={t('title')}
        actions={
          chatData && <PublicButton chatId={chatId} isPublic={chatData.isPublic} onPublicChange={handlePublicChange} />
        }
      />

      <div className="flex flex-1 items-stretch overflow-hidden">
        {/* Left side: Phase Progress + Chat Area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Phase Progress Bar */}
          {projectData && <PhaseProgress phases={phaseProgress} />}

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
                  finalDocument={requirementContent.final!}
                  onSuccess={handleNextPhaseSuccess}
                />
              </div>
            )}

            {/* Code Generation Button */}
            {showCodeGenerationButton && (
              <div className="mx-auto max-w-3xl px-4 pb-4">
                <CodeGenerationButton
                  documents={{
                    ...(projectData!.documents.requirement && {
                      requirement: { content: projectData!.documents.requirement.content },
                    }),
                    ...(projectData!.documents.architecture && {
                      architecture: { content: projectData!.documents.architecture.content },
                    }),
                    ...(projectData!.documents.development && {
                      development: { content: projectData!.documents.development.content },
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
          documents={{
            ...(projectData?.documents.requirement && {
              requirement: {
                content: projectData.documents.requirement.content,
                status: projectData.documents.requirement.status,
              },
            }),
            ...(projectData?.documents.architecture && {
              architecture: {
                content: projectData.documents.architecture.content,
                status: projectData.documents.architecture.status,
              },
            }),
            ...(projectData?.documents.development && {
              development: {
                content: projectData.documents.development.content,
                status: projectData.documents.development.status,
              },
            }),
          }}
          isVisible={showRequirementSidebar}
          onToggle={() => setShowRequirementSidebar(!showRequirementSidebar)}
          onQuote={handleQuote}
          chatId={projectData?.rootChatId || chatId}
          activeTab={draftActiveTab}
          onActiveTabChange={setDraftActiveTab}
          currentPhase={projectData?.currentPhase}
        />
      </div>
    </div>
  )
}
