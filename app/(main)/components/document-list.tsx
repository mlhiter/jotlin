'use client'

import { useState, useEffect } from 'react'
import { FileIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

import Item from './item'

import { cn } from '@/libs/utils'
import { Doc } from '@/types/document'
import { useQuery } from '@tanstack/react-query'
import { useDocumentStore } from '@/stores/document'

interface DocumentListProps {
  parentDocumentId?: string | null
  level?: number
  data?: Doc[]
  type: 'private' | 'share'
  forceExpanded?: boolean
}

const DocumentList = ({
  parentDocumentId,
  level = 0,
  type,
  forceExpanded = false,
}: DocumentListProps) => {
  const params = useParams()
  const router = useRouter()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const { setDocuments, getDocuments } = useDocumentStore()

  // Handle force expansion when new documents are created
  useEffect(() => {
    if (forceExpanded && level === 0) {
      // Expand root level documents when forceExpanded is true
      const currentDocs = getDocuments(parentDocumentId ?? null, type)
      if (currentDocs && currentDocs.length > 0) {
        const newExpanded: Record<string, boolean> = {}
        currentDocs.forEach((doc) => {
          newExpanded[doc.id] = true
        })
        setExpanded(newExpanded)
      }
    }
  }, [forceExpanded, level, parentDocumentId, type, getDocuments])

  const onExpand = (documentId: string) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [documentId]: !prevExpanded[documentId],
    }))
  }

  parentDocumentId = parentDocumentId ? parentDocumentId : null
  const currentDocuments = getDocuments(parentDocumentId, type)

  useQuery({
    queryKey: ['documents', parentDocumentId, type],
    queryFn: () => setDocuments(parentDocumentId, type),
  })

  const onRedirect = (documentId: string) => {
    router.push(`/documents/${documentId}`)
  }

  if (currentDocuments === undefined) {
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
      {currentDocuments.map((document: Doc) => (
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
            ownerId={document.userId}
          />
          {expanded[document.id] && (
            <DocumentList
              parentDocumentId={document.id}
              level={level + 1}
              type={type}
              forceExpanded={forceExpanded}
            />
          )}
        </div>
      ))}
    </>
  )
}

export default DocumentList
