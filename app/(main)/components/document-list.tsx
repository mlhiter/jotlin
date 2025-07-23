'use client'

import { useState } from 'react'
import { FileIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

import Item from './item'

import { cn } from '@/libs/utils'
import { Doc } from '@/types/document'
import { useQuery } from '@tanstack/react-query'
import { useDocumentStore } from '@/stores/document'

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
  const { setDocuments, getDocuments } = useDocumentStore()

  const onExpand = (documentId: string) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [documentId]: !prevExpanded[documentId],
    }))
  }

  parentDocumentId = parentDocumentId ? parentDocumentId : ''

  const { data: documents } = useQuery({
    queryKey: ['documents', parentDocumentId, type],
    queryFn: () => setDocuments(parentDocumentId, type),
  })

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
        <div key={document.id}>
          <Item
            type={type}
            id={document.id}
            onClick={() => onRedirect(document.id)}
            label={document.title as string}
            icon={FileIcon}
            documentIcon={document.icon}
            active={params.documentId === document.id}
            level={level}
            onExpand={() => onExpand(document.id)}
            expanded={expanded[document.id]}
          />
          {expanded[document.id] && (
            <DocumentList
              parentDocumentId={document.id}
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
