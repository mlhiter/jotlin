'use client'

import * as Y from 'yjs'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useTheme } from 'next-themes'
import { BlockNoteEditor } from '@blocknote/core'
import { en } from '@blocknote/core/locales'
import { WebrtcProvider } from 'y-webrtc'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BlockNoteView } from '@blocknote/mantine'
import { filterSuggestionItems } from '@blocknote/core'
import {
  SuggestionMenuController,
  FormattingToolbarController,
} from '@blocknote/react'

import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'

import { uploadImage } from '@/api/image'
import { useSession } from '@/hooks/use-session'
import { getRandomLightColor } from '@/libs/utils'
import { blockSchema, getCustomSlashMenuItems } from './editor-blocks'
import { formattingToolbar } from './editor-toolbars'
import { CommentList } from './editor-blocks/comment-list'

interface EditorProps {
  onChange: (value: string) => void
  initialContent?: string
  webrtcProvider?: WebrtcProvider
  ydoc?: Y.Doc
  editable?: boolean
}

const Editor = ({
  onChange,
  initialContent,
  editable,
  webrtcProvider,
  ydoc,
}: EditorProps) => {
  const { resolvedTheme } = useTheme()
  const { user } = useSession()
  const params = useParams()

  const handleUpload = useCallback(async (file: File) => {
    const res = await uploadImage({
      file,
    })
    return res
  }, [])
  const editor = BlockNoteEditor.create({
    schema: blockSchema,
    initialContent: initialContent ? JSON.parse(initialContent) : undefined,
    uploadFile: handleUpload,
    dictionary: en,
    collaboration:
      webrtcProvider && ydoc
        ? {
            provider: webrtcProvider,
            fragment: ydoc.getXmlFragment('document-store'),
            user: {
              name: user?.name as string,
              color: getRandomLightColor(),
            },
          }
        : undefined,
  })

  // monitor clipboard,when last paste item is md-text,insert after currentBlock.
  // Load commented blocks
  useEffect(() => {
    const loadComments = async () => {
      try {
        const response = await fetch(
          `/api/comments?documentId=${params.documentId}`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch comments')
        }
        const comments = await response.json()
        comments.forEach((comment: any) => {
          const block = editor.getBlock(comment.blockId)
          if (block) {
            editor.updateBlock(block, {
              props: {
                ...block.props,
                backgroundColor: 'commented',
              },
            })
          }
        })
      } catch (error) {
        console.error('Error loading comments:', error)
      }
    }

    if (params.documentId) {
      loadComments()
    }
  }, [params.documentId])

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData ? event.clipboardData.items : []
      const item = items[items.length - 1]
      const currentBlock = editor.getTextCursorPosition().block

      // markhtml will be parsed to blocks, so we only handle text/plain
      if (item.kind === 'string' && item.type === 'text/plain') {
        item.getAsString(async (markdown) => {
          const markdownHtml = await marked.parse(
            markdown.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ''),
            { breaks: true, async: true }
          )
          const cleanedHtml = DOMPurify.sanitize(markdownHtml)
          const blocksFromHTML = await editor.tryParseHTMLToBlocks(cleanedHtml)
          editor.replaceBlocks([currentBlock], blocksFromHTML)
        })
      }
    }

    document.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [editor, handleUpload])

  return (
    <div className="grid grid-cols-[1fr,300px] gap-4">
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        onChange={() => {
          onChange(JSON.stringify(editor.document, null, 2))
        }}
        formattingToolbar={false}
        slashMenu={false}>
        <SuggestionMenuController
          triggerCharacter={'/'}
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor), query)
          }
        />
        <FormattingToolbarController formattingToolbar={formattingToolbar} />
      </BlockNoteView>
      <div className="border-l">
        <div className="border-b p-4">
          <h2 className="font-semibold">Comments</h2>
        </div>
        <CommentList editor={editor} />
      </div>
    </div>
  )
}

export default Editor
