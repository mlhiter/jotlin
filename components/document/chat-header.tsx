'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { MoreVertical } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { ThreadSwitcher } from '@/components/chat/thread-switcher'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'

import apiClient from '@/libs/utils/axios'

interface ChatThread {
  id: string
  title: string | null
  messageCount: number
  lastMessageAt: Date
}

interface ChatHeaderProps {
  projectId: string
  workspaceId: string
  title: string
  icon?: string | null
  description?: string | null
  threads?: ChatThread[]
  currentThreadId?: string | null
  onSelectThread?: (threadId: string) => void
  onCreateThread?: () => void
  onRenameThread?: (threadId: string, newTitle: string) => void
  onDeleteThread?: (threadId: string) => void
  threadsLoading?: boolean
}

export function ChatHeader({
  projectId,
  workspaceId,
  title: propTitle,
  icon: propIcon,
  description: propDescription,
  threads = [],
  currentThreadId,
  onSelectThread,
  onCreateThread,
  onRenameThread,
  onDeleteThread,
  threadsLoading = false,
}: ChatHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(propTitle)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const [localTitle, setLocalTitle] = useState(propTitle)
  const [localIcon, setLocalIcon] = useState(propIcon)

  const titleInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    setLocalTitle(propTitle)
  }, [propTitle])

  useEffect(() => {
    setLocalIcon(propIcon)
  }, [propIcon])

  const updateMutation = useMutation({
    mutationFn: async (data: { title?: string; icon?: string; description?: string }) => {
      const response = await apiClient.patch(`/api/projects/${projectId}`, data)
      return response.data
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['projects', workspaceId] })
      const previousProjects = queryClient.getQueryData(['projects', workspaceId])

      queryClient.setQueryData(['projects', workspaceId], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.map((proj: any) => (proj.id === projectId ? { ...proj, ...newData } : proj))
      })

      return { previousProjects }
    },
    onError: (err, newData, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', workspaceId], context.previousProjects)
      }
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['projects', workspaceId], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.map((proj: any) => (proj.id === projectId ? updatedProject : proj))
      })
    },
  })

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  const handleTitleClick = () => {
    setEditedTitle(localTitle)
    setIsEditingTitle(true)
  }

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== localTitle) {
      setLocalTitle(editedTitle.trim())
      updateMutation.mutate({ title: editedTitle.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setEditedTitle(localTitle)
      setIsEditingTitle(false)
    }
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setLocalIcon(emojiData.emoji)
    updateMutation.mutate({ icon: emojiData.emoji })
    setShowEmojiPicker(false)
  }

  const displayIcon = localIcon && localIcon !== '📁' ? localIcon : '📁'

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-1 items-start gap-3">
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <button className="mt-0.5 text-2xl transition-transform hover:scale-110">{displayIcon}</button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" side="bottom" align="start">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </PopoverContent>
        </Popover>

        <div className="min-w-0 flex-1">
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="h-9 text-xl font-semibold"
            />
          ) : (
            <h1
              className="hover:text-muted-foreground cursor-pointer text-xl font-semibold transition-colors"
              onClick={handleTitleClick}>
              {localTitle}
            </h1>
          )}
        </div>
      </div>

      {onSelectThread && onCreateThread && onRenameThread && onDeleteThread && (
        <div className="flex shrink-0 items-center">
          <ThreadSwitcher
            threads={threads}
            currentThreadId={currentThreadId || ''}
            onSelectThread={onSelectThread}
            onCreateThread={onCreateThread}
            onRenameThread={onRenameThread}
            onDeleteThread={onDeleteThread}
            isLoading={threadsLoading}
          />
        </div>
      )}
    </div>
  )
}
