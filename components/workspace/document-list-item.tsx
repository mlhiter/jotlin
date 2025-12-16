'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { File, Bot } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

import { Input } from '@/components/ui/input'
import { SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar'

import apiClient from '@/libs/utils/axios'

interface DocumentListItemProps {
  doc: {
    id: string
    title: string
    documentType: string
    icon: string | null
    isAIGenerated: boolean
  }
  workspaceId: string
  projectId: string
  isActive: boolean
}

const BUILT_IN_TYPES = ['PRD', 'PAR', 'User Stories', 'Flows', 'Wireframe', 'Sitemap']

export function DocumentListItem({ doc, workspaceId, projectId, isActive }: DocumentListItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(doc.title)
  const [localTitle, setLocalTitle] = useState(doc.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Sync with props when they change from server
  useEffect(() => {
    setLocalTitle(doc.title)
  }, [doc.title])

  const updateMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiClient.patch(`/api/documents/${doc.id}`, { title })
      return response.data
    },
    onMutate: async (newTitle) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['documents'] })
      await queryClient.cancelQueries({ queryKey: ['document', doc.id] })

      // Snapshot previous value
      const previousDocuments = queryClient.getQueryData(['documents'])
      const previousDocument = queryClient.getQueryData(['document', doc.id])

      // Optimistically update documents list
      queryClient.setQueriesData({ queryKey: ['documents'] }, (old: any) => {
        if (!old) return old
        if (Array.isArray(old)) {
          return old.map((d: any) => (d.id === doc.id ? { ...d, title: newTitle } : d))
        }
        return old
      })

      // Optimistically update document
      queryClient.setQueryData(['document', doc.id], (old: any) => {
        if (!old) return old
        return { ...old, title: newTitle }
      })

      return { previousDocuments, previousDocument }
    },
    onError: (err, newTitle, context) => {
      // Rollback on error
      if (context?.previousDocuments) {
        queryClient.setQueryData(['documents'], context.previousDocuments)
      }
      if (context?.previousDocument) {
        queryClient.setQueryData(['document', doc.id], context.previousDocument)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['document', doc.id] })
    },
  })

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setEditedTitle(localTitle)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editedTitle.trim() && editedTitle !== localTitle) {
      setLocalTitle(editedTitle.trim()) // Immediate local update
      updateMutation.mutate(editedTitle.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditedTitle(localTitle)
      setIsEditing(false)
    }
  }

  const showBadge = BUILT_IN_TYPES.includes(doc.documentType)

  if (isEditing) {
    return (
      <SidebarMenuSubItem>
        <div className="px-2">
          <Input
            ref={inputRef}
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-7 text-sm"
          />
        </div>
      </SidebarMenuSubItem>
    )
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={isActive}>
        <Link
          href={`/${workspaceId}/${projectId}/${doc.id}`}
          className="flex items-center gap-1.5"
          onDoubleClick={handleDoubleClick}>
          {doc.icon && doc.icon !== '📄' ? <span className="text-sm">{doc.icon}</span> : <File className="h-4 w-4" />}
          <span className="min-w-0 flex-1 truncate">{localTitle}</span>
          <div className="flex shrink-0 items-center gap-1">
            {showBadge && (
              <span className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-xs">
                {doc.documentType}
              </span>
            )}
            {doc.isAIGenerated && <Bot className="h-3 w-3" />}
          </div>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}
