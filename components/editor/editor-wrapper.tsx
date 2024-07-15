'use client'

import * as Y from 'yjs'
import dynamic from 'next/dynamic'
import { WebrtcProvider } from 'y-webrtc'
import { useEffect, useState } from 'react'

interface EditorWrapperProps {
  onChange: (value: string) => void
  documentId: string
  initialContent?: string
  isShared: boolean
}

export const EditorWrapper = ({
  onChange,
  initialContent,
  documentId,
  isShared,
}: EditorWrapperProps) => {
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
      signaling: [process.env.NEXT_PUBLIC_WS_URL!],
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
      onChange={onChange}
      ydoc={ydoc}
      webrtcProvider={webrtcProvider}
      initialContent={initialContent}
    />
  )
}
