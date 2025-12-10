'use client'

import { DocumentType } from '@/schema/chat'
import { cn } from '@/libs/utils/utils'

import { Markdown } from './markdown'
import { MermaidChart } from './mermaid-chart'

interface DocumentRendererProps {
  content: string
  documentType: DocumentType
  className?: string
}

export function DocumentRenderer({ content, documentType, className }: DocumentRendererProps) {
  if (!content) {
    return (
      <div className={cn('flex min-h-[500px] items-center justify-center rounded-xl border border-dashed', className)}>
        <div className="text-center">
          <div className="bg-muted/50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <svg
              className="text-muted-foreground h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <p className="text-foreground mb-1 text-sm font-medium">No document content available</p>
          <p className="text-muted-foreground text-xs">Generate documents to see them here</p>
        </div>
      </div>
    )
  }

  const isMermaidDocument = ['FLOWCHART', 'SITEMAP', 'WIREFRAME'].includes(documentType)

  if (isMermaidDocument) {
    return (
      <div className={cn('', className)}>
        <MermaidChart code={content} />
      </div>
    )
  }

  return (
    <div className={cn('', className)}>
      <div className="rounded-lg border border-border/40 bg-muted/20 p-8">
        <Markdown content={content} />
      </div>
    </div>
  )
}
