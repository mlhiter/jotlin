'use client'

import { Bot, ChevronRight, File, Folder, FolderPlus, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { DocumentListItem } from './document-list-item'

export function WorkspaceSidebar() {
  const { workspace, isLoading: isLoadingWorkspace } = useWorkspace()
  const { projects, createProject, isCreating, isLoading: isLoadingProjects } = useProjects(workspace?.id)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [creatingProject, setCreatingProject] = useState(false)
  const pathname = usePathname()

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
              <ProjectSkeleton />
              <ProjectSkeleton />
              <ProjectSkeleton />
            </>
          ) : projects.length > 0 ? (
            projects.map((project) => (
              <ProjectTreeItem
                key={project.id}
                project={project}
                workspaceId={workspace?.id || ''}
                isExpanded={expandedProjects.has(project.id)}
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
    _count: {
      documents: number
    }
  }
  workspaceId: string
  isExpanded: boolean
  onToggle: () => void
  onExpand: (projectId: string) => void
}

function ProjectTreeItem({ project, workspaceId, isExpanded, onToggle, onExpand }: ProjectTreeItemProps) {
  // Only load documents when expanded
  const { documents, createDocument, isCreating, isLoading } = useDocuments({
    projectId: project.id,
    enabled: isExpanded,
  })
  const [creatingDoc, setCreatingDoc] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

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

  const isProjectChatActive = pathname === `/${workspaceId}/${project.id}`

  return (
    <SidebarMenuItem>
      <div className="group/project flex w-full items-center gap-1">
        {/* Chevron button - toggle expand/collapse */}
        <button
          onClick={onToggle}
          className="flex h-8 w-6 shrink-0 items-center justify-center rounded-md hover:bg-accent"
        >
          <ChevronRight
            className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
          />
        </button>

        {/* Project name - navigate to project chat */}
        <SidebarMenuButton asChild isActive={isProjectChatActive} className="flex-1">
          <Link href={`/${workspaceId}/${project.id}`} className="flex min-w-0 items-center gap-2">
            {project.icon && project.icon !== '📁' ? (
              <span className="shrink-0 text-base">{project.icon}</span>
            ) : (
              <Folder className="h-4 w-4 shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate text-left">{project.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{project._count.documents}</span>
          </Link>
        </SidebarMenuButton>

        {/* Create document button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover/project:opacity-100"
          onClick={handleCreateDocument}
          disabled={isCreating || creatingDoc}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {isExpanded && isLoading && (
        <SidebarMenuSub>
          <SidebarMenuSubItem>
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem>
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem>
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
}

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
