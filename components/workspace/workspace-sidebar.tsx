'use client'

import { Bot, ChevronRight, File, Folder, FolderPlus, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

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

export function WorkspaceSidebar() {
  const { workspace, isLoading: isLoadingWorkspace } = useWorkspace()
  const { projects, createProject, isCreating, isLoading: isLoadingProjects } = useProjects(workspace?.id)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [creatingProject, setCreatingProject] = useState(false)
  const pathname = usePathname()

  const isLoading = isLoadingWorkspace || isLoadingProjects

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
                isActive={pathname?.includes(project.id)}
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
  isActive: boolean
}

function ProjectTreeItem({ project, workspaceId, isExpanded, onToggle, isActive, onExpand }: ProjectTreeItemProps & { onExpand: (projectId: string) => void }) {
  const { documents, createDocument, isCreating } = useDocuments({ projectId: project.id })
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

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <div className="group flex w-full items-center gap-2">
          <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2">
            <ChevronRight
              className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-90')}
            />
            {project.icon && project.icon !== '📁' ? (
              <span className="shrink-0 text-base">{project.icon}</span>
            ) : (
              <Folder className="h-4 w-4 shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate text-left">{project.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{project._count.documents}</span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleCreateDocument}
            disabled={isCreating || creatingDoc}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </SidebarMenuButton>

      {isExpanded && documents.length > 0 && (
        <SidebarMenuSub>
          {documents.map((doc) => (
            <SidebarMenuSubItem key={doc.id}>
              <SidebarMenuSubButton
                asChild
                isActive={pathname === `/${workspaceId}/${project.id}/${doc.id}`}
              >
                <Link href={`/${workspaceId}/${project.id}/${doc.id}`}>
                  {doc.icon && doc.icon !== '📄' ? (
                    <span className="text-sm">{doc.icon}</span>
                  ) : (
                    <File className="h-4 w-4" />
                  )}
                  <span className="truncate">{doc.title}</span>
                  {doc.isAIGenerated && <Bot className="h-3 w-3" />}
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}

      {isExpanded && documents.length === 0 && (
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
