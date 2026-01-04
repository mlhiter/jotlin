'use client'

import { ChevronDown, ChevronUp, FileText, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ToolResult {
  success?: boolean
  message?: string
  documentId?: string
  versionId?: string
  title?: string
  type?: string
  document?: {
    title: string
  }
  [key: string]: unknown
}

interface ToolCallCardProps {
  toolName: string
  toolCallId?: string
  args: Record<string, string | number | boolean | undefined>
  result?: ToolResult
  isExecuting?: boolean
  defaultCollapsed?: boolean
  workspaceId?: string
  projectId?: string
}

export function ToolCallCard({
  toolName,
  args,
  result,
  isExecuting = false,
  defaultCollapsed = true,
  workspaceId,
  projectId,
}: ToolCallCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const getToolIcon = () => {
    switch (toolName) {
      case 'create_document':
        return <FileText className="h-4 w-4" strokeWidth={1.5} />
      case 'update_document':
        return <FileText className="h-4 w-4" strokeWidth={1.5} />
      case 'list_documents':
        return <FileText className="h-4 w-4" strokeWidth={1.5} />
      case 'get_document':
        return <FileText className="h-4 w-4" strokeWidth={1.5} />
      default:
        return <FileText className="h-4 w-4" strokeWidth={1.5} />
    }
  }

  const getToolLabel = () => {
    switch (toolName) {
      case 'create_document':
        return 'Creating Document'
      case 'update_document':
        return 'Updating Document'
      case 'list_documents':
        return 'Listing Documents'
      case 'get_document':
        return 'Getting Document'
      default:
        return toolName
    }
  }

  const getStatusIcon = () => {
    if (isExecuting) {
      return <Loader2 className="text-primary h-4 w-4 animate-spin" strokeWidth={1.5} />
    }

    if (result?.success === false) {
      return <XCircle className="text-destructive h-4 w-4" strokeWidth={1.5} />
    }

    return <CheckCircle2 className="text-green-600 dark:text-green-500 h-4 w-4" strokeWidth={1.5} />
  }

  const getSummary = () => {
    if (!args) return ''

    switch (toolName) {
      case 'create_document':
        return `Title: "${args.title || 'Untitled'}"`
      case 'update_document':
        return args.changeDescription || 'Updating content'
      case 'list_documents':
        return args.documentType ? `Type: ${args.documentType}` : 'All documents'
      case 'get_document':
        return result?.document?.title || 'Loading...'
      default:
        return ''
    }
  }

  const getResultMessage = () => {
    if (isExecuting) {
      return 'Executing...'
    }

    if (result?.success === false) {
      return result?.message || 'Operation failed'
    }

    return result?.message || 'Operation completed successfully'
  }

  const shouldShowOpenButton = () => {
    // 仅对文档创建/更新工具显示
    if (toolName !== 'create_document' && toolName !== 'update_document') {
      return false
    }

    // 必须有成功的结果和 documentId
    if (!result || result.success !== true || !result.documentId) {
      return false
    }

    // 必须有导航所需的 context
    if (!workspaceId || !projectId) {
      return false
    }

    return true
  }

  const getDocumentUrl = () => {
    if (!result?.documentId || !workspaceId || !projectId) {
      return ''
    }
    return `/${workspaceId}/${projectId}/${result.documentId}`
  }

  return (
    <Card className="border-border/40 bg-muted/20 mr-12 shadow-none transition-all duration-150">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full cursor-pointer p-3 text-left transition-colors hover:bg-accent/30"
        type="button">
        <div className="flex items-start gap-3">
          <div className="text-muted-foreground mt-0.5 shrink-0">{getToolIcon()}</div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-foreground text-sm font-medium">{getToolLabel()}</span>
              {getStatusIcon()}
            </div>

            {!isCollapsed && (
              <div className="text-muted-foreground mt-2 space-y-2 text-xs">
                <div className="bg-background/50 rounded-md border border-border/40 p-2">
                  <div className="mb-1 font-medium">Parameters:</div>
                  <pre className="whitespace-pre-wrap break-words font-mono">
                    {args ? JSON.stringify(args, null, 2) : 'No parameters'}
                  </pre>
                </div>

                {result && (
                  <div className="bg-background/50 rounded-md border border-border/40 p-2">
                    <div className="mb-1 font-medium">Result:</div>
                    <pre className="whitespace-pre-wrap break-words font-mono">{JSON.stringify(result, null, 2)}</pre>
                  </div>
                )}

                {shouldShowOpenButton() && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5 hover:bg-accent/50 w-full">
                      <Link href={getDocumentUrl()}>
                        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                        打开文档
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {isCollapsed && (
              <div className="text-muted-foreground mt-1 text-xs">
                <div>{getSummary()}</div>
                <div className="mt-1 flex items-center gap-1">
                  {getStatusIcon()}
                  <span>{getResultMessage()}</span>
                </div>

                {shouldShowOpenButton() && (
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5 hover:bg-accent/50">
                      <Link href={getDocumentUrl()}>
                        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                        打开文档
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-muted-foreground mt-0.5 shrink-0">
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
            )}
          </div>
        </div>
      </button>
    </Card>
  )
}
