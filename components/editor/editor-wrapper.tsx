'use client'

import dynamic from 'next/dynamic'
import { memo, useEffect, useState } from 'react'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'

interface EditorWrapperProps {
  onChange: (value: string) => void
  documentId: string
  initialContent?: string
  initialMarkdown?: string
  isShared: boolean
}

// Keep track of active rooms to prevent duplicate initialization
const activeRooms = new Map<string, { doc: Y.Doc; provider: WebrtcProvider }>()

const EditorWrapper = memo(
  ({
    onChange,
    initialContent,
    initialMarkdown,
    documentId,
    isShared,
  }: EditorWrapperProps) => {
    const Editor = dynamic(() => import('@/components/editor/editor'), {
      ssr: false,
    })

    const [ydoc, setYdoc] = useState<Y.Doc | null>(null)
    const [webrtcProvider, setWebrtcProvider] = useState<WebrtcProvider | null>(
      null
    )
    const [isConnecting, setIsConnecting] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      if (!isShared) {
        setYdoc(null)
        setWebrtcProvider(null)
        setIsConnecting(false)
        return
      }

      let retryCount = 0
      const maxRetries = 3
      const retryDelay = 2000

      const cleanup = () => {
        const activeRoom = activeRooms.get(documentId)
        if (activeRoom) {
          activeRoom.provider.disconnect()
          activeRoom.provider.destroy()
          activeRoom.doc.destroy()
          activeRooms.delete(documentId)
        }
        setYdoc(null)
        setWebrtcProvider(null)
      }

      const initializeCollaboration = () => {
        try {
          // Check if room already exists
          let activeRoom = activeRooms.get(documentId)

          if (activeRoom) {
            // Reuse existing room
            setYdoc(activeRoom.doc)
            setWebrtcProvider(activeRoom.provider)
            setIsConnecting(false)
            setError(null)
            return
          }

          // Create new room
          const newYdoc = new Y.Doc()
          const newWebrtcProvider = new WebrtcProvider(documentId, newYdoc, {
            signaling: [process.env.NEXT_PUBLIC_WEBRTC_URL!],
            maxConns: 20,
            filterBcConns: false,
            peerOpts: {
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:global.stun.twilio.com:3478' },
                ],
              },
            },
          })

          // Store in global map
          activeRooms.set(documentId, {
            doc: newYdoc,
            provider: newWebrtcProvider,
          })

          newWebrtcProvider.on(
            'status',
            ({ connected }: { connected: boolean }) => {
              if (connected) {
                console.info('WebRTC connection established successfully')
                setIsConnecting(false)
                setError(null)
                retryCount = 0
              } else {
                console.info(
                  'WebRTC connection lost, attempting to reconnect...'
                )
                handleConnectionError(new Error('Connection lost'))
              }
            }
          )

          setYdoc(newYdoc)
          setWebrtcProvider(newWebrtcProvider)
        } catch (error) {
          console.error('Failed to initialize collaboration:', error)
          setError('Failed to initialize collaboration')
          cleanup()
        }
      }

      const handleConnectionError = (err: Error) => {
        console.error('WebRTC connection error:', err)
        setError('Connection error occurred')

        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(() => {
            console.info(`Retrying connection (attempt ${retryCount})...`)
            cleanup()
            initializeCollaboration()
          }, retryDelay * retryCount)
        } else {
          setError('Failed to establish connection after multiple attempts')
          cleanup()
        }
      }

      initializeCollaboration()

      return () => {
        if (!activeRooms.has(documentId)) return
        cleanup()
      }
    }, [documentId, isShared])

    if (!isShared) {
      return (
        <Editor
          onChange={onChange}
          initialContent={initialContent}
          initialMarkdown={initialMarkdown}
        />
      )
    }

    if (error) {
      return (
        <div className="p-4 text-red-500">
          Error: {error}. Please refresh the page to try again.
        </div>
      )
    }

    if (isConnecting || !ydoc || !webrtcProvider) {
      return <div className="p-4">Initializing collaborative editor...</div>
    }

    return (
      <Editor
        ydoc={ydoc}
        webrtcProvider={webrtcProvider}
        onChange={onChange}
        initialContent={initialContent}
      />
    )
  }
)

EditorWrapper.displayName = 'EditorWrapper'

export { EditorWrapper }
