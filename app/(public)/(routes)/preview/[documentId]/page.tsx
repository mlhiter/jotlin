'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'

import Cover from '@/components/cover'
import Toolbar from '@/components/toolbar'
import { Skeleton } from '@/components/ui/skeleton'

import { documentApi } from '@/api/document'
import { useDocumentActions } from '@/hooks/use-document-actions'

interface DocumentIdPageProps {
  params: {
    documentId: string
  }
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const Editor = useMemo(
    () => dynamic(() => import('@/components/editor/editor'), { ssr: false }),
    []
  )
  const { updateDocument } = useDocumentActions()

  const { data: document } = useQuery({
    queryKey: ['document', params.documentId],
    queryFn: () => documentApi.getById(params.documentId),
  })

  const onChange = async (content: string) => {
    await updateDocument({
      id: params.documentId,
      content,
    })
  }
  if (document === undefined) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="mx-auto mt-10 md:max-w-3xl lg:max-w-4xl">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-[50%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </div>
    )
  }
  if (document === null) {
    return <div>Not found</div>
  }
  return (
    <div className="pb-40">
      <Cover preview url={document.coverImage} />
      <div className="mx-auto md:max-w-3xl lg:max-w-4xl">
        <Toolbar preview />
        <Editor
          editable={false}
          onChange={onChange}
          initialContent={document.content}
        />
      </div>
    </div>
  )
}

export default DocumentIdPage
