import { Metadata } from 'next'

interface ProjectPageProps {
  params: Promise<{
    projectId: string
  }>
}

export const metadata: Metadata = {
  title: 'Project | Jotlin',
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">Project Chat</h1>
        <p className="text-sm text-muted-foreground">Project ID: {projectId}</p>
      </div>
      <div className="flex-1 p-4">
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Project Chat interface coming soon</p>
        </div>
      </div>
    </div>
  )
}
