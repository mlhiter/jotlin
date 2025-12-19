'use client'

import { useState, useRef, useEffect } from 'react'
import { Folder, MoreVertical } from 'lucide-react'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import apiClient from '@/libs/utils/axios'

interface ProjectHeaderProps {
  projectId: string
  workspaceId: string
  title: string
  icon?: string | null
  description?: string | null
}

export function ProjectHeader({ projectId, workspaceId, title: propTitle, icon: propIcon, description: propDescription }: ProjectHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(propTitle)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState(propDescription || '')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Local optimistic state
  const [localTitle, setLocalTitle] = useState(propTitle)
  const [localIcon, setLocalIcon] = useState(propIcon)
  const [localDescription, setLocalDescription] = useState(propDescription)

  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()

  // Sync with props when they change from server
  useEffect(() => {
    setLocalTitle(propTitle)
  }, [propTitle])

  useEffect(() => {
    setLocalIcon(propIcon)
  }, [propIcon])

  useEffect(() => {
    setLocalDescription(propDescription)
  }, [propDescription])

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
        return old.map((proj: any) =>
          proj.id === projectId ? { ...proj, ...newData } : proj
        )
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
        return old.map((proj: any) =>
          proj.id === projectId ? updatedProject : proj
        )
      })
    },
  })

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus()
    }
  }, [isEditingDescription])

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

  const handleDescriptionClick = () => {
    setEditedDescription(localDescription || '')
    setIsEditingDescription(true)
  }

  const handleDescriptionSave = () => {
    if (editedDescription !== localDescription) {
      setLocalDescription(editedDescription)
      updateMutation.mutate({ description: editedDescription })
    }
    setIsEditingDescription(false)
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditedDescription(localDescription || '')
      setIsEditingDescription(false)
    }
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setLocalIcon(emojiData.emoji)
    updateMutation.mutate({ icon: emojiData.emoji })
    setShowEmojiPicker(false)
  }

  const displayIcon = localIcon && localIcon !== '📁' ? localIcon : '📁'

  return (
    <div className="flex items-start justify-between border-b px-6 py-4">
      <div className="flex items-start gap-3 flex-1">
        {/* Editable icon */}
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <button className="text-2xl transition-transform hover:scale-110 mt-0.5">
              {displayIcon}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" side="bottom" align="start">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </PopoverContent>
        </Popover>

        <div className="flex-1 min-w-0">
          {/* Editable title */}
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
              className="cursor-pointer text-xl font-semibold hover:text-muted-foreground transition-colors"
              onClick={handleTitleClick}
            >
              {localTitle}
            </h1>
          )}

          {/* Editable description */}
          {isEditingDescription ? (
            <Textarea
              ref={descriptionInputRef}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={handleDescriptionSave}
              onKeyDown={handleDescriptionKeyDown}
              className="mt-1 min-h-[60px] text-sm resize-none"
              placeholder="Add a description..."
            />
          ) : (
            <p
              className="mt-1 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={handleDescriptionClick}
            >
              {localDescription || 'Add a description...'}
            </p>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled>Share</DropdownMenuItem>
          <DropdownMenuItem disabled>Export</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
