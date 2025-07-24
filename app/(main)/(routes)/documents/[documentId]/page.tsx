'use client'

import { debounce } from 'lodash'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useCallback } from 'react'

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
  const { setCurrentDocument, currentDocument, clearCurrentDocument } =
    useDocumentStore()

  useEffect(() => {
    return () => {
      clearCurrentDocument()
    }
  }, [clearCurrentDocument])

  const { data: document } = useQuery({
    queryKey: ['document', params.documentId],
    queryFn: async () => {
      const document = await getDocumentById(params.documentId)
      return document
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: !!params.documentId,
    refetchOnReconnect: true,
  })

  useEffect(() => {
    if (document) {
      setCurrentDocument(document)
    }
  }, [document, setCurrentDocument])

  const onChange = useCallback(
    async (content: string) => {
      await updateDocument({
        id: params.documentId,
        content,
      })
    },
    [params.documentId]
  )

  const debounceOnChange = useMemo(() => debounce(onChange, 1000), [onChange])

  useEffect(() => {
    return () => {
      debounceOnChange.cancel()
    }
  }, [debounceOnChange])

  const editorProps = useMemo(
    () => ({
      onChange: debounceOnChange,
      documentId: params.documentId,
      initialContent: currentDocument?.content,
      isShared: (currentDocument?.collaborators?.length ?? 0) > 1,
    }),
    [
      debounceOnChange,
      params.documentId,
      currentDocument?.content,
      currentDocument?.collaborators?.length,
    ]
  )

  if (!document && currentDocument === undefined) {
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

  if (currentDocument === null) {
    return <div>Not found</div>
  }

  return (
    <div className="pb-40">
      <Cover url={currentDocument?.coverImage} />
      <div className="mx-auto md:max-w-3xl lg:max-w-4xl">
        <Toolbar />
        <EditorWrapper {...editorProps} />
      </div>
    </div>
  )
}

export default DocumentIdPage
