'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

import { DocumentType } from '@/schema/chat'
import { cn } from '@/libs/utils/utils'

import { Button } from '@/components/ui/button'
import { Markdown } from './markdown'
import { MermaidChart } from './mermaid-chart'

interface DocumentRendererProps {
  content: string
  documentType: DocumentType
  className?: string
}

export function DocumentRenderer({ content, documentType, className }: DocumentRendererProps) {
  const [copied, setCopied] = useState(false)

  if (!content) {
    return (
      <div className={cn('flex items-center justify-center rounded-lg border border-dashed p-12', className)}>
        <div className="text-center">
          <p className="text-muted-foreground text-sm">No document content available</p>
          <p className="text-muted-foreground mt-1 text-xs">Generate documents to see them here</p>
        </div>
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Render Mermaid diagrams
  const isMermaidDocument = ['FLOWCHART', 'SITEMAP', 'WIREFRAME'].includes(documentType)

  if (isMermaidDocument) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {documentType === 'FLOWCHART' && 'Business Flowchart'}
            {documentType === 'SITEMAP' && 'Site Structure Map'}
            {documentType === 'WIREFRAME' && 'UI Wireframe'}
          </h3>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy Code'}
          </Button>
        </div>
        <MermaidChart code={content} />
      </div>
    )
  }

  // Render Markdown documents (REQUIREMENT, PRD)
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {documentType === 'REQUIREMENT' && 'Requirement Document'}
          {documentType === 'PRD' && 'Product Requirements Document'}
        </h3>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <Markdown content={content} />
      </div>
    </div>
  )
}
