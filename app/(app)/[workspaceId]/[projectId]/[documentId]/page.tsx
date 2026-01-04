'use client'

import { Loader2 } from 'lucide-react'
import { use } from 'react'

import { DocumentView } from '@/components/document/document-view'

import { useDocument } from '@/hooks/use-document'

interface DocumentPageProps {
  params: Promise<{
    projectId: string
    documentId: string
  }>
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const { documentId } = use(params)

  const { document, isLoading } = useDocument(documentId)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Document not found</p>
      </div>
    )
  }

  return <DocumentView document={document} />
}
