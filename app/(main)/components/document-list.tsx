'use client'

import { useState } from 'react'
import { FileIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

import Item from './item'
import { cn } from '@/lib/utils'
import { Doc, useSidebar } from '@/api/document'

interface DocumentListProps {
  parentDocumentId?: string
  level?: number
  data?: Doc[]
  type: 'private' | 'share'
}

const DocumentList = ({
  parentDocumentId,
  level = 0,
  type,
}: DocumentListProps) => {
  const params = useParams()
  const router = useRouter()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // function: 切换展开状态
  const onExpand = (documentId: string) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [documentId]: !prevExpanded[documentId],
    }))
  }

  parentDocumentId = parentDocumentId ? parentDocumentId : ''

  const { documents } = useSidebar(parentDocumentId, type)

  // function: 点击重定向到文档详情页
  const onRedirect = (documentId: string) => {
    router.push(`/documents/${documentId}`)
  }

  if (documents === undefined) {
    return (
      <>
        <Item.Skeleton level={level} />
        {level === 0 && (
          <>
            <Item.Skeleton level={level} />
            <Item.Skeleton level={level} />
          </>
        )}
      </>
    )
  }

  return (
    <>
      {/* 展开时渲染 */}
      <p
        style={{
          paddingLeft: `${level * 12 + 25}px`,
        }}
        className={cn(
          'hidden text-sm font-medium text-muted-foreground/80',
          expanded && 'last:block'
        )}>
        No pages inside
      </p>
      {documents.map((document: Doc) => (
        <div key={document._id}>
          <Item
            type={type}
            id={document._id}
            onClick={() => onRedirect(document._id)}
            label={document.title as string}
            icon={FileIcon}
            documentIcon={document.icon}
            active={params.documentId === document._id}
            level={level}
            onExpand={() => onExpand(document._id)}
            expanded={expanded[document._id]}
          />
          {expanded[document._id] && (
            <DocumentList
              parentDocumentId={document._id}
              level={level + 1}
              type={type}
            />
          )}
        </div>
      ))}
    </>
  )
}

export default DocumentList
