'use client'

import { memo } from 'react'
import dynamic from 'next/dynamic'

interface EditorWrapperProps {
  onChange: (value: string) => void
  documentId: string
  initialContent?: string
  isShared: boolean
}

const EditorWrapper = memo(
  ({ onChange, initialContent, documentId, isShared }: EditorWrapperProps) => {
    const Editor = dynamic(() => import('@/components/editor/editor'), {
      ssr: false,
    })

    if (!isShared) {
      return (
        <Editor
          onChange={onChange}
          initialContent={initialContent}
          documentId={documentId}
        />
      )
    }
    return (
      <Editor
        onChange={onChange}
        initialContent={initialContent}
        documentId={documentId}
      />
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.initialContent === nextProps.initialContent &&
      prevProps.isShared === nextProps.isShared &&
      prevProps.documentId === nextProps.documentId
    )
  }
)

EditorWrapper.displayName = 'EditorWrapper'

export { EditorWrapper }
