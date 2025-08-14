'use client'

import { debounce } from 'lodash'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useCallback } from 'react'

import Cover from '@/components/cover'
import Toolbar from '@/components/toolbar'
import { Skeleton } from '@/components/ui/skeleton'
import { EditorWrapper } from '@/components/editor/editor-wrapper'

import { documentApi } from '@/api/document'
import { useDocumentStore } from '@/stores/document'
import { analyzeContent } from '@/libs/content-detector'

interface DocumentIdPageProps {
  params: {
    documentId: string
  }
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const { setCurrentDocument, currentDocument, clearCurrentDocument } =
    useDocumentStore()
  const queryClient = useQueryClient()

  useEffect(() => {
    return () => {
      clearCurrentDocument()
    }
  }, [clearCurrentDocument])

  // 暴露重新加载文档的函数到全局
  useEffect(() => {
    const reloadDocument = () => {
      // 无效化当前文档的查询缓存，触发重新获取
      queryClient.invalidateQueries({
        queryKey: ['document', params.documentId],
      })
    }

    // 将函数绑定到window对象
    ;(window as any).reloadDocument = reloadDocument

    return () => {
      delete (window as any).reloadDocument
    }
  }, [queryClient, params.documentId])

  const { data: document } = useQuery({
    queryKey: ['document', params.documentId],
    queryFn: async () => {
      const document = await documentApi.getById(params.documentId)
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
      await documentApi.update({
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

  const editorProps = useMemo(() => {
    if (!currentDocument?.content) {
      return {
        onChange: debounceOnChange,
        documentId: params.documentId,
        initialContent: undefined,
        initialMarkdown: undefined,
        isShared: (currentDocument?.collaborators?.length ?? 0) > 1,
      }
    }

    // Analyze content using the advanced detector
    const analysis = analyzeContent(currentDocument.content)

    console.log('Content analysis result:', {
      type: analysis.type,
      confidence: analysis.confidence,
      isValid: analysis.isValid,
      issues: analysis.issues,
    })

    let contentToUse = analysis.content

    // Auto-fix recursive JSON nesting if detected
    if (analysis.type === 'recursive-json') {
      console.log('Auto-fixing recursive JSON nesting')

      // Auto-save the fixed content
      setTimeout(() => {
        console.log('Auto-saving fixed content...')
        documentApi
          .update({
            id: params.documentId,
            content: contentToUse,
          })
          .catch((error) => {
            console.error('Failed to auto-save fixed content:', error)
          })
      }, 1000)
    }

    // Determine how to handle the content based on analysis
    const shouldTreatAsMarkdown =
      analysis.type === 'markdown' ||
      (analysis.type === 'unknown' && analysis.confidence < 50)

    return {
      onChange: debounceOnChange,
      documentId: params.documentId,
      initialContent: shouldTreatAsMarkdown ? undefined : contentToUse,
      initialMarkdown: shouldTreatAsMarkdown ? contentToUse : undefined,
      isShared: (currentDocument?.collaborators?.length ?? 0) > 1,
    }
  }, [
    debounceOnChange,
    params.documentId,
    currentDocument?.content,
    currentDocument?.collaborators?.length,
  ])

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
