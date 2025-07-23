'use client'

import { debounce } from 'lodash'
import { useQuery } from '@tanstack/react-query'

import Cover from '@/components/cover'
import Toolbar from '@/components/toolbar'
import { Skeleton } from '@/components/ui/skeleton'
import { EditorWrapper } from '@/components/editor/editor-wrapper'

import { getDocumentById, updateDocument } from '@/api/document'
import { useDocumentStore } from '@/stores/document'

interface DocumentIdPageProps {
  params: {
    documentId: string
  }
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const { setCurrentDocument } = useDocumentStore()
  const { data: document } = useQuery({
    queryKey: ['document', params.documentId],
    queryFn: async () => {
      const document = await getDocumentById(params.documentId)
      setCurrentDocument(document)
      return document
    },
  })
  const onChange = async (content: string) => {
    if (!document) return
    await updateDocument({
      id: document.id,
      content,
    })
  }

  const debounceOnChange = debounce(onChange, 1000)

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
      <Cover url={document.coverImage} />
      <div className="mx-auto md:max-w-3xl lg:max-w-4xl">
        <Toolbar />
        <EditorWrapper
          onChange={debounceOnChange}
          documentId={params.documentId}
          initialContent={document.content}
          isShared={document.collaborators!.length > 1}
        />
      </div>
    </div>
  )
}

export default DocumentIdPage
