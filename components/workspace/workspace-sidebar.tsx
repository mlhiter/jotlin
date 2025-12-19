'use client'

import { Bot, ChevronRight, File, Folder, FolderPlus, Plus, MoreHorizontal, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, memo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'

import { useDocuments } from '@/hooks/use-documents'
import { useProjects } from '@/hooks/use-projects'
import { useWorkspace } from '@/hooks/use-workspace'
import { cn } from '@/libs/utils/utils'
import apiClient from '@/libs/utils/axios'
import { DocumentListItem } from './document-list-item'

export function WorkspaceSidebar() {
  const { workspace, isLoading: isLoadingWorkspace } = useWorkspace()
  const { projects, createProject, isCreating, isLoading: isLoadingProjects } = useProjects(workspace?.id)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [creatingProject, setCreatingProject] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const pathname = usePathname()
  const router = useRouter()

  const isLoading = isLoadingWorkspace || isLoadingProjects

  // Auto-expand project based on current path
  useEffect(() => {
    if (pathname && projects.length > 0) {
      // Path format: /{workspaceId}/{projectId}/{documentId}
      const pathParts = pathname.split('/').filter(Boolean)
      if (pathParts.length >= 2) {
        const projectId = pathParts[1]
        // Check if this projectId exists in our projects
        if (projects.some((p) => p.id === projectId)) {
          setExpandedProjects((prev) => new Set(prev).add(projectId))
        }
      }
    }
  }, [pathname, projects])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (projects.length === 0) return

      // Only handle arrow keys when not in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((prev) => Math.min(prev + 1, projects.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'ArrowRight':
          e.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < projects.length) {
            const project = projects[focusedIndex]
            setExpandedProjects((prev) => new Set(prev).add(project.id))
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < projects.length) {
            const project = projects[focusedIndex]
            setExpandedProjects((prev) => {
              const newSet = new Set(prev)
              newSet.delete(project.id)
              return newSet
            })
          }
          break
        case 'Enter':
          e.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < projects.length && workspace?.id) {
            const project = projects[focusedIndex]
            router.push(`/${workspace.id}/${project.id}`)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [projects, focusedIndex, workspace?.id, router])

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  const expandProject = (projectId: string) => {
    setExpandedProjects((prev) => new Set(prev).add(projectId))
  }

  const handleCreateProject = async () => {
    if (!workspace?.id || creatingProject) return
    setCreatingProject(true)
    try {
      const project = await createProject({
        workspaceId: workspace.id,
        title: 'New Project',
      })
      setExpandedProjects((prev) => new Set(prev).add(project.id))
    } finally {
      setCreatingProject(false)
    }
  }

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between px-2">
        {isLoadingWorkspace ? (
          <Skeleton className="h-4 w-28" />
        ) : (
          <SidebarGroupLabel>{workspace?.title || 'Workspace'}</SidebarGroupLabel>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCreateProject}
          disabled={!workspace?.id || isCreating || creatingProject}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only">New Project</span>
        </Button>
      </div>

      <SidebarGroupContent>
        <SidebarMenu>
          {isLoading ? (
            <>
              <ProjectSkeleton key="skeleton-1" />
              <ProjectSkeleton key="skeleton-2" />
              <ProjectSkeleton key="skeleton-3" />
            </>
          ) : projects.length > 0 ? (
            projects.map((project, index) => (
              <ProjectTreeItemWrapper
                key={project.id}
                project={project}
                workspaceId={workspace?.id || ''}
                isExpanded={expandedProjects.has(project.id)}
                isFocused={focusedIndex === index}
                onToggle={() => toggleProject(project.id)}
                onExpand={expandProject}
              />
            ))
          ) : (
            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
              <FolderPlus className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No projects yet</p>
              <p className="mt-1 text-xs">Click + to create one</p>
            </div>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

interface ProjectTreeItemProps {
  project: {
    id: string
    title: string
    icon: string | null
    description: string | null
    _count: {
      documents: number
    }
  }
  workspaceId: string
  isExpanded: boolean
  isFocused: boolean
  onToggle: () => void
  onExpand: (projectId: string) => void
}

const ProjectTreeItemWrapper = memo(function ProjectTreeItem({ project, workspaceId, isExpanded, isFocused, onToggle, onExpand }: ProjectTreeItemProps) {
  // Only load documents when expanded
  const { documents, createDocument, isCreating, isLoading } = useDocuments({
    projectId: project.id,
    enabled: isExpanded,
  })
  const [creatingDoc, setCreatingDoc] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/projects/${project.id}`)
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects'] })

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData(['projects'])

      // Optimistically remove the project from the list
      queryClient.setQueryData(['projects'], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.filter((p: any) => p.id !== project.id)
      })

      // Redirect to workspace home if we're viewing this project
      if (pathname?.startsWith(`/${workspaceId}/${project.id}`)) {
        router.push(`/${workspaceId}`)
      }

      return { previousProjects }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const handleCreateDocument = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (creatingDoc || !workspaceId) return
    setCreatingDoc(true)
    try {
      const newDocument = await createDocument({
        workspaceId,
        projectId: project.id,
        title: 'New Document',
      })
      onExpand(project.id)
      router.push(`/${workspaceId}/${project.id}/${newDocument.id}`)
    } finally {
      setCreatingDoc(false)
    }
  }

  const handleDelete = () => {
    // Store the snapshot before deletion
    const previousProjects = queryClient.getQueryData(['projects'])

    // Optimistically remove from UI immediately
    queryClient.setQueryData(['projects'], (old: any) => {
      if (!old || !Array.isArray(old)) return old
      return old.filter((p: any) => p.id !== project.id)
    })

    // Redirect if viewing this project
    if (pathname?.startsWith(`/${workspaceId}/${project.id}`)) {
      router.push(`/${workspaceId}`)
    }

    // Show toast with undo action
    toast(`Moved "${project.title}" to trash`, {
      action: {
        label: 'Undo',
        onClick: () => {
          // Restore the project
          queryClient.setQueryData(['projects'], previousProjects)
          toast.dismiss()
        },
      },
      duration: 5000,
    })

    // Execute delete after a short delay (allows undo)
    setTimeout(() => {
      deleteMutation.mutate()
    }, 100)
  }

  const isProjectChatActive = pathname === `/${workspaceId}/${project.id}`

  return (
    <SidebarMenuItem>
      <div className={cn(
        "group/project relative flex w-full items-center rounded-md transition-colors",
        isFocused && "bg-sidebar-accent ring-1 ring-sidebar-border/50"
      )}>
        {/* Project link - flexible width */}
        <SidebarMenuButton asChild isActive={isProjectChatActive} className="flex-1 min-w-0 pr-0">
          <Link href={`/${workspaceId}/${project.id}`} className="flex min-w-0 items-center gap-2 pl-2">
            {/* Icon/Chevron container - icon by default, chevron on hover */}
            <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
              {/* Chevron - only shown on hover, replaces icon */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggle()
                }}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/project:opacity-100 transition-opacity z-10"
              >
                <ChevronRight
                  className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isExpanded && 'rotate-90')}
                />
              </button>

              {/* Icon - hidden on hover */}
              <div className="absolute inset-0 flex items-center justify-center group-hover/project:opacity-0 transition-opacity">
                {project.icon && project.icon !== '📁' ? (
                  <span className="text-base leading-none">{project.icon}</span>
                ) : (
                  <Folder className="h-4 w-4" />
                )}
              </div>
            </div>

            {/* Title - extends to full width when buttons are hidden */}
            <span className="min-w-0 flex-1 truncate text-left group-hover/project:pr-14">
              {project.title}
            </span>
          </Link>
        </SidebarMenuButton>

        {/* Action buttons - absolute positioned, only shown on hover */}
        <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover/project:opacity-100 transition-opacity pointer-events-none group-hover/project:pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCreateDocument}
            disabled={isCreating || creatingDoc}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom" className="w-48">
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isExpanded && isLoading && (
        <SidebarMenuSub>
          <SidebarMenuSubItem key={`${project.id}-doc-skeleton-1`}>
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem key={`${project.id}-doc-skeleton-2`}>
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem key={`${project.id}-doc-skeleton-3`}>
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      )}

      {isExpanded && !isLoading && documents.length > 0 && (
        <SidebarMenuSub>
          {documents.map((doc) => (
            <DocumentListItem
              key={doc.id}
              doc={doc}
              workspaceId={workspaceId}
              projectId={project.id}
              isActive={pathname === `/${workspaceId}/${project.id}/${doc.id}`}
            />
          ))}
        </SidebarMenuSub>
      )}

      {isExpanded && !isLoading && documents.length === 0 && (
        <SidebarMenuSub>
          <div className="px-2 py-2 text-xs text-muted-foreground">No documents</div>
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
})

function ProjectSkeleton() {
  return (
    <SidebarMenuItem>
      <div className="flex h-8 w-full items-center gap-2 px-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-3 w-4" />
      </div>
    </SidebarMenuItem>
  )
}
