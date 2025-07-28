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

    const [ydoc, setYdoc] = useState<Y.Doc>()
    const [webrtcProvider, setWebrtcProvider] = useState<
      WebrtcProvider | undefined
    >()

    useEffect(() => {
      const newYdoc = new Y.Doc()
      setYdoc(newYdoc)

      const newWebrtcProvider = new WebrtcProvider(documentId, newYdoc, {
        signaling: [process.env.NEXT_PUBLIC_WEBRTC_URL!],
      })
      setWebrtcProvider(newWebrtcProvider)

      return () => {
        newWebrtcProvider.destroy()
        newYdoc.destroy()
      }
    }, [])

    if (!isShared) {
      return <Editor onChange={onChange} initialContent={initialContent} />
    }

    return (
      <Editor
        ydoc={ydoc}
        webrtcProvider={webrtcProvider}
        onChange={onChange}
        initialContent={initialContent}
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
