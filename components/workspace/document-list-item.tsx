'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { File, Bot, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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

export const DocumentListItem = memo(function DocumentListItem({
  doc,
  workspaceId,
  projectId,
  isActive,
}: DocumentListItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(doc.title)
  const [localTitle, setLocalTitle] = useState(doc.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const router = useRouter()

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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/documents/${doc.id}`)
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['documents'] })

      // Snapshot previous value
      const previousDocuments = queryClient.getQueryData(['documents'])

      // Optimistically remove the document from the list
      queryClient.setQueriesData({ queryKey: ['documents'] }, (old: any) => {
        if (!old) return old
        if (Array.isArray(old)) {
          return old.filter((d: any) => d.id !== doc.id)
        }
        return old
      })

      // Update project count
      queryClient.setQueryData(['projects'], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.map((p: any) =>
          p.id === projectId ? { ...p, _count: { documents: (p._count?.documents || 1) - 1 } } : p
        )
      })

      // Redirect to project if we're viewing this document
      if (pathname === `/${workspaceId}/${projectId}/${doc.id}`) {
        router.push(`/${workspaceId}/${projectId}`)
      }

      return { previousDocuments }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousDocuments) {
        queryClient.setQueriesData({ queryKey: ['documents'] }, context.previousDocuments)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setEditedTitle(localTitle)
      setIsEditing(true)
    },
    [localTitle]
  )

  const handleEdit = useCallback(() => {
    setEditedTitle(localTitle)
    setIsEditing(true)
  }, [localTitle])

  const handleDelete = useCallback(() => {
    // Store the snapshot before deletion
    const previousDocuments = queryClient.getQueryData(['documents'])

    // Optimistically remove from UI immediately
    queryClient.setQueriesData({ queryKey: ['documents'] }, (old: any) => {
      if (!old) return old
      if (Array.isArray(old)) {
        return old.filter((d: any) => d.id !== doc.id)
      }
      return old
    })

    // Update project count
    queryClient.setQueryData(['projects'], (old: any) => {
      if (!old || !Array.isArray(old)) return old
      return old.map((p: any) =>
        p.id === projectId ? { ...p, _count: { documents: (p._count?.documents || 1) - 1 } } : p
      )
    })

    // Redirect if viewing this document
    if (pathname === `/${workspaceId}/${projectId}/${doc.id}`) {
      router.push(`/${workspaceId}/${projectId}`)
    }

    // Show toast with undo action
    toast(`Moved "${localTitle}" to trash`, {
      action: {
        label: 'Undo',
        onClick: () => {
          // Restore the document
          queryClient.setQueriesData({ queryKey: ['documents'] }, previousDocuments)
          queryClient.invalidateQueries({ queryKey: ['projects'] })
          toast.dismiss()
        },
      },
      duration: 5000,
    })

    // Execute delete after a short delay (allows undo)
    setTimeout(() => {
      deleteMutation.mutate()
    }, 100)
  }, [queryClient, doc.id, localTitle, pathname, workspaceId, projectId, router, deleteMutation])

  const handleSave = useCallback(() => {
    if (editedTitle.trim() && editedTitle !== localTitle) {
      setLocalTitle(editedTitle.trim()) // Immediate local update
      updateMutation.mutate(editedTitle.trim())
    }
    setIsEditing(false)
  }, [editedTitle, localTitle, updateMutation])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave()
      } else if (e.key === 'Escape') {
        setEditedTitle(localTitle)
        setIsEditing(false)
      }
    },
    [handleSave, localTitle]
  )

  const showBadge = useMemo(() => BUILT_IN_TYPES.includes(doc.documentType), [doc.documentType])

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
      <div className="group/document relative -mr-2.5 flex w-full items-center rounded-md transition-colors">
        <SidebarMenuSubButton asChild isActive={isActive} className="min-w-0 flex-1 pr-0">
          <Link
            href={`/${workspaceId}/${projectId}/${doc.id}`}
            className="flex min-w-0 items-center gap-1.5"
            onDoubleClick={handleDoubleClick}>
            {doc.icon && doc.icon !== '📄' ? <span className="text-sm">{doc.icon}</span> : <File className="h-4 w-4" />}
            <span className="min-w-0 flex-1 truncate group-hover/document:pr-8">{localTitle}</span>
            <div className="flex shrink-0 items-center gap-1 group-hover/document:hidden">
              {showBadge && (
                <span className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 text-xs">
                  {doc.documentType}
                </span>
              )}
              {doc.isAIGenerated && <Bot className="h-3 w-3" />}
            </div>
          </Link>
        </SidebarMenuSubButton>

        {/* Action buttons - absolute positioned, only shown on hover */}
        <div className="pointer-events-none absolute right-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/document:pointer-events-auto group-hover/document:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom" className="w-48">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} disabled={deleteMutation.isPending} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </SidebarMenuSubItem>
  )
})
