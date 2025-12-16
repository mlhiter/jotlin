import { Metadata } from 'next'

interface DocumentPageProps {
  params: Promise<{
    projectId: string
    documentId: string
  }>
}

export const metadata: Metadata = {
  title: 'Document | Jotlin',
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { projectId, documentId } = await params

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">Document Editor</h1>
        <p className="text-sm text-muted-foreground">
          Project: {projectId} | Document: {documentId}
        </p>
      </div>
      <div className="flex-1 p-4">
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Document Editor interface coming soon</p>
        </div>
      </div>
    </div>
  )
}
