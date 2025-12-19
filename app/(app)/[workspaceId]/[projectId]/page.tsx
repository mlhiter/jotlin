'use client'

import { Loader2 } from 'lucide-react'
import { use } from 'react'

import { ChatArea } from '@/components/chat/chat-area'
import { ProjectHeader } from '@/components/workspace/project-header'

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

  return (
    <div className="flex h-full flex-col">
      <ProjectHeader
        projectId={project.id}
        workspaceId={workspaceId}
        title={project.title}
        icon={project.icon}
        description={project.description}
      />
      <ChatArea type="PROJECT" entityId={projectId} workspaceId={workspaceId} />
    </div>
  )
}
