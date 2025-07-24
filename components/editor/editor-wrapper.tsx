'use client'

import * as Y from 'yjs'
import dynamic from 'next/dynamic'
import { WebrtcProvider } from 'y-webrtc'
import { memo, useEffect, useState } from 'react'

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
      return <Editor onChange={onChange} initialContent={initialContent} />
    }
    return <Editor onChange={onChange} initialContent={initialContent} />
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
