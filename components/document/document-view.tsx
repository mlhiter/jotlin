'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { ChatArea } from '@/components/chat/chat-area'

import { useAutoSave } from '@/hooks/use-auto-save'
import {
  useChatThreads,
  useCreateChatThread,
  useDeleteChatThread,
  useRenameChatThread,
} from '@/hooks/use-chat-threads'
import { useProjects } from '@/hooks/use-projects'

import { DocumentHeader } from './document-header'
import { MarkdownEditor } from './markdown-editor'

interface Document {
  id: string
  projectId: string | null
  workspaceId: string
  title: string
  content: string
  documentType: string
  icon: string | null
  isAIGenerated: boolean
  lastEditedAt: string
}

interface DocumentViewProps {
  document: Document
}

export function DocumentView({ document }: DocumentViewProps) {
  const [content, setContent] = useState(document.content)
  const [currentTab, setCurrentTab] = useState('editor')
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)

  const { status, lastSavedAt } = useAutoSave({
    documentId: document.id,
    content,
    delay: 1000,
    initialLastSavedAt: document.lastEditedAt ? new Date(document.lastEditedAt) : null,
  })

  // Get project info for Chat tab
  const { projects } = useProjects(document.workspaceId)
  const project = projects?.find((p) => p.id === document.projectId)

  // Load chat threads for the project
  const { data: threads, isLoading: threadsLoading } = useChatThreads({
    projectId: document.projectId || undefined,
  })

  const createThread = useCreateChatThread()
  const renameThread = useRenameChatThread()
  const deleteThread = useDeleteChatThread()

  // Auto-select first thread when switching to chat tab
  useEffect(() => {
    if (currentTab === 'chat' && threads && threads.length > 0 && !currentThreadId) {
      setCurrentThreadId(threads[0].id)
    }
  }, [currentTab, threads, currentThreadId])

  // Thread management handlers
  const handleCreateThread = async () => {
    if (!document.projectId) return
    try {
      const newThread = await createThread.mutateAsync({
        projectId: document.projectId,
        workspaceId: document.workspaceId,
        title: 'New Conversation',
      })
      setCurrentThreadId(newThread.id)
      toast.success('Thread created')
    } catch (error) {
      console.error('Failed to create thread:', error)
      toast.error('Failed to create thread')
    }
  }

  const handleRenameThread = async (threadId: string, newTitle: string) => {
    try {
      await renameThread.mutateAsync({ threadId, title: newTitle })
      toast.success('Thread renamed')
    } catch (error) {
      console.error('Failed to rename thread:', error)
      toast.error('Failed to rename thread')
    }
  }

  const handleDeleteThread = async (threadId: string) => {
    try {
      await deleteThread.mutateAsync(threadId)

      if (threadId === currentThreadId && threads && threads.length > 1) {
        const otherThread = threads.find((t) => t.id !== threadId)
        setCurrentThreadId(otherThread?.id || null)
      }

      toast.success('Thread deleted')
    } catch (error) {
      console.error('Failed to delete thread:', error)
      toast.error('Failed to delete thread')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <DocumentHeader
        documentId={document.id}
        title={document.title}
        documentType={document.documentType}
        icon={document.icon || undefined}
        isAIGenerated={document.isAIGenerated}
        saveStatus={status}
        lastSavedAt={lastSavedAt}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        projectId={document.projectId || undefined}
        workspaceId={document.workspaceId}
        projectTitle={project?.title}
        projectIcon={project?.icon || undefined}
        projectDescription={project?.description || undefined}
        threads={threads}
        currentThreadId={currentThreadId}
        onSelectThread={setCurrentThreadId}
        onCreateThread={handleCreateThread}
        onRenameThread={handleRenameThread}
        onDeleteThread={handleDeleteThread}
        threadsLoading={threadsLoading}
      />

      <div className="flex-1 overflow-hidden">
        {currentTab === 'editor' && <MarkdownEditor key={document.id} initialContent={content} onChange={setContent} />}

        {currentTab === 'chat' && document.projectId && (
          <ChatArea
            type="PROJECT"
            entityId={document.projectId}
            workspaceId={document.workspaceId}
            currentThreadId={currentThreadId}
          />
        )}

        {currentTab === 'chat' && !document.projectId && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">This document is not associated with a project</p>
          </div>
        )}
      </div>
    </div>
  )
}
