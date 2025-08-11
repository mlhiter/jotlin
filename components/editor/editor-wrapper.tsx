'use client'

import * as Y from 'yjs'
import dynamic from 'next/dynamic'
import { WebrtcProvider } from 'y-webrtc'
import { memo, useEffect, useState } from 'react'

interface EditorWrapperProps {
  onChange: (value: string) => void
  documentId: string
  initialContent?: string
  initialMarkdown?: string
  isShared: boolean
}

const EditorWrapper = memo(
  ({ onChange, initialContent, initialMarkdown, documentId, isShared }: EditorWrapperProps) => {
    const Editor = dynamic(() => import('@/components/editor/editor'), {
      ssr: false,
    })

    if (!isShared) {
      return (
        <Editor 
          onChange={onChange} 
          initialContent={initialContent} 
          initialMarkdown={initialMarkdown}
        />
      )
    }
    return (
      <Editor 
        onChange={onChange} 
        initialContent={initialContent} 
        initialMarkdown={initialMarkdown}
      />
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.initialContent === nextProps.initialContent &&
      prevProps.initialMarkdown === nextProps.initialMarkdown &&
      prevProps.isShared === nextProps.isShared &&
      prevProps.documentId === nextProps.documentId
    )
  }
)

EditorWrapper.displayName = 'EditorWrapper'

export { EditorWrapper }
