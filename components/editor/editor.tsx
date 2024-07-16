'use client'

import * as Y from 'yjs'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useTheme } from 'next-themes'
import { BlockNoteEditor, locales } from '@blocknote/core'
import { WebrtcProvider } from 'y-webrtc'
import { useCallback, useEffect } from 'react'
import { BlockNoteView } from '@blocknote/mantine'
import { filterSuggestionItems } from '@blocknote/core'
import {
  SuggestionMenuController,
  FormattingToolbarController,
} from '@blocknote/react'

import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'

import { upload } from '@/api/image'
import { useSession } from '@/hooks/use-session'
import { getRandomLightColor } from '@/lib/utils'
import { blockSchema, getCustomSlashMenuItems } from './editor-blocks'
import { formattingToolbar } from './editor-toolbars'

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

  const handleUpload = useCallback(async (file: File) => {
    const res = await upload({
      file,
    })
    return res
  }, [])
  const editor = BlockNoteEditor.create({
    schema: blockSchema,
    initialContent: initialContent ? JSON.parse(initialContent) : undefined,
    uploadFile: handleUpload,
    dictionary: locales.en,
    collaboration:
      webrtcProvider && ydoc
        ? {
            provider: webrtcProvider,
            fragment: ydoc.getXmlFragment('document-store'),
            user: {
              name: user?.username as string,
              color: getRandomLightColor(),
            },
          }
        : undefined,
  })
  console.log('editor', editor)

  // monitor clipboard,when last paste item is md-text,insert after currentBlock.
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
    <div>
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
    </div>
  )
}

export default Editor
