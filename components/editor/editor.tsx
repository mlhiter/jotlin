'use client'

import * as Y from 'yjs'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useTheme } from 'next-themes'
import { WebrtcProvider } from 'y-webrtc'
import { useCallback, useEffect } from 'react'
import { BlockNoteView } from '@blocknote/mantine'
import { filterSuggestionItems, PartialBlock } from '@blocknote/core'
import {
  SuggestionMenuController,
  FormattingToolbarController,
  useCreateBlockNote,
} from '@blocknote/react'
import { en } from '@blocknote/core/locales'

import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

import { imageApi } from '@/api/image'
import { useSession } from '@/hooks/use-session'
import { blockSchema, getCustomSlashMenuItems } from './editor-blocks'
import { formattingToolbar } from './editor-toolbars'

interface EditorProps {
  onChange: (value: string) => void
  initialContent?: string
  initialMarkdown?: string // Add support for markdown content
  webrtcProvider?: WebrtcProvider
  ydoc?: Y.Doc
  editable?: boolean
}

const Editor = ({
  onChange,
  initialContent,
  initialMarkdown,
  editable,
  webrtcProvider,
  ydoc,
}: EditorProps) => {
  const { resolvedTheme } = useTheme()
  const { user } = useSession()

  const handleUpload = useCallback(async (file: File) => {
    const res = await imageApi.upload({
      file,
    })
    return res
  }, [])
  const editor = useCreateBlockNote({
    schema: blockSchema,
    initialContent: initialContent ? JSON.parse(initialContent) : undefined,
    uploadFile: handleUpload,
    dictionary: en,
    // collaboration:
    //   webrtcProvider && ydoc
    //     ? {
    //         provider: webrtcProvider,
    //         fragment: ydoc.getXmlFragment('document-store'),
    //         user: {
    //           name: user?.username as string,
    //           color: getRandomLightColor(),
    //         },
    //       }
    //     : undefined,
  })

  // Handle initial markdown content
  useEffect(() => {
    if (initialMarkdown && !initialContent) {
      const loadMarkdownContent = async () => {
        try {
          console.log(
            'Loading initial markdown content, length:',
            initialMarkdown.length
          )
          const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown)
          console.log(
            'Successfully parsed markdown to',
            blocks.length,
            'blocks'
          )
          editor.replaceBlocks(editor.document, blocks)
        } catch (error) {
          console.error(
            'Failed to parse initial markdown with BlockNote parser:',
            error
          )
          console.log(
            'Markdown preview:',
            initialMarkdown.substring(0, 300) + '...'
          )

          // Fallback: use our enhanced markdown parser
          try {
            const { convertMarkdownToBlocks } = await import(
              '@/libs/markdown-to-blocknote'
            )
            const fallbackBlocks = await convertMarkdownToBlocks(
              initialMarkdown,
              null
            )
            console.log(
              'Fallback parser created',
              fallbackBlocks.length,
              'blocks'
            )
            editor.replaceBlocks(editor.document, fallbackBlocks)
          } catch (fallbackError) {
            console.error('Fallback parser also failed:', fallbackError)
            // Ultimate fallback: create simple paragraph
            const simpleBlock = [
              {
                id: Math.random().toString(36).substring(2, 11),
                type: 'paragraph',
                props: {
                  textColor: 'default',
                  backgroundColor: 'default',
                  textAlignment: 'left',
                },
                content: [{ type: 'text', text: initialMarkdown, styles: {} }],
                children: [],
              },
            ] as PartialBlock[]
            editor.replaceBlocks(editor.document, simpleBlock)
          }
        }
      }
      loadMarkdownContent()
    }
  }, [editor, initialMarkdown, initialContent])

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
