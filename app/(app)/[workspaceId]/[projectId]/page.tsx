'use client'

import { Loader2 } from 'lucide-react'
import { use, useState, useEffect } from 'react'
import { toast } from 'sonner'

import { ChatArea } from '@/components/chat/chat-area'
import { ChatHeader } from '@/components/document/chat-header'

import { useChatThreads, useCreateChatThread, useDeleteChatThread, useRenameChatThread } from '@/hooks/use-chat-threads'
import { useProjects } from '@/hooks/use-projects'

interface ProjectPageProps {
  params: Promise<{
    workspaceId: string
    projectId: string
  }>
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { workspaceId, projectId } = use(params)
  const { projects, isLoading } = useProjects(workspaceId)
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)

  // Thread management hooks
  const { data: threads, isLoading: threadsLoading } = useChatThreads({ projectId })
  const createThread = useCreateChatThread()
  const renameThread = useRenameChatThread()
  const deleteThread = useDeleteChatThread()

  // Auto-select first thread when threads load
  useEffect(() => {
    if (threads && threads.length > 0 && !currentThreadId) {
      setCurrentThreadId(threads[0].id)
    }
  }, [threads, currentThreadId])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  const project = projects?.find((p) => p.id === projectId)

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  const handleCreateThread = async () => {
    try {
      const newThread = await createThread.mutateAsync({
        projectId,
        workspaceId,
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
      <div className="border-b px-6 py-4">
        <ChatHeader
          projectId={project.id}
          workspaceId={workspaceId}
          title={project.title}
          icon={project.icon}
          description={project.description}
          threads={threads}
          currentThreadId={currentThreadId}
          onSelectThread={setCurrentThreadId}
          onCreateThread={handleCreateThread}
          onRenameThread={handleRenameThread}
          onDeleteThread={handleDeleteThread}
          threadsLoading={threadsLoading}
        />
      </div>
      <ChatArea type="PROJECT" entityId={projectId} workspaceId={workspaceId} currentThreadId={currentThreadId} />
    </div>
  )
}
