'use client'

import { Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

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
  result,
  isExecuting = false,
  workspaceId,
  projectId,
}: ToolCallCardProps) {
  const getLoadingText = () => {
    switch (toolName) {
      case 'create_document':
        return '正在创建文档'
      case 'update_document':
        return '正在更新文档'
      case 'list_documents':
        return '正在获取文档列表'
      case 'get_document':
        return '正在获取文档内容'
      default:
        return '正在处理'
    }
  }

  const shouldShowButton = () => {
    return (
      (toolName === 'create_document' || toolName === 'update_document') &&
      !isExecuting &&
      result?.success === true &&
      result?.documentId &&
      workspaceId &&
      projectId
    )
  }

  const getDocumentUrl = () => {
    if (!result?.documentId || !workspaceId || !projectId) {
      return ''
    }
    return `/${workspaceId}/${projectId}/${result.documentId}`
  }

  // Loading state
  if (isExecuting) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
        <span>{getLoadingText()}</span>
      </div>
    )
  }

  // Completed - only show button for create/update document
  if (shouldShowButton()) {
    return (
      <Button asChild variant="outline" size="sm" className="h-8 gap-1.5">
        <Link href={getDocumentUrl()}>
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
          查看文档
        </Link>
      </Button>
    )
  }

  // Other tools - don't show anything
  return null
}
