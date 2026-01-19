'use client'

import { FolderPlus, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useProjects } from '@/hooks/use-projects'
import { useWorkspace } from '@/hooks/use-workspace'

export default function WorkspacePage() {
  const router = useRouter()
  const { workspace, isLoading: isLoadingWorkspace } = useWorkspace()
  const { projects, createProject, isLoading: isLoadingProjects, isCreating } = useProjects(workspace?.id)
  const [creating, setCreating] = useState(false)

  const isLoading = isLoadingWorkspace || isLoadingProjects

  const handleCreateProject = async () => {
    if (!workspace?.id || creating) return
    setCreating(true)
    try {
      const project = await createProject({
        workspaceId: workspace.id,
        title: 'New Project',
      })
      router.push(`/${workspace.id}/${project.id}`)
    } finally {
      setCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="flex max-w-md flex-col items-center text-center">

          <h1 className="text-xl font-semibold text-foreground">Create Your First Project</h1>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Projects help you organize your documents and AI conversations. Start by creating your first project.
          </p>

          <Button
            onClick={handleCreateProject}
            disabled={isCreating || creating}
            className="mt-6 gap-2"
            size="lg">
            <FolderPlus className="h-4 w-4" strokeWidth={1.5} />
            {creating ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-border/40 bg-muted/20">
          <FolderPlus className="h-8 w-8 text-muted-foreground/70" strokeWidth={1.5} />
        </div>

        <h1 className="text-xl font-semibold text-foreground">Welcome to Your Workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Select a project from the sidebar to view documents and conversations, or create a new project to get started.
        </p>
      </div>
    </div>
  )
}
