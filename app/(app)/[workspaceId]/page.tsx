import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workspace | Jotlin',
  description: 'Manage your projects and documents',
}

export default function WorkspacePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Welcome to Your Workspace</h1>
        <p className="mt-2 text-muted-foreground">
          Select a project from the sidebar or create a new one to get started
        </p>
      </div>
    </div>
  )
}
