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
import { filterSuggestionItems, PartialBlock } from '@blocknote/core'
import {
  SuggestionMenuController,
  FormattingToolbarController,
} from '@blocknote/react'

import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'

import { imageApi } from '@/api/image'
import { useSession } from '@/hooks/use-session'
import { getRandomLightColor } from '@/libs/utils'
import { blockSchema, getCustomSlashMenuItems } from './editor-blocks'
import { formattingToolbar } from './editor-toolbars'
import { PositionedCommentList } from './editor-blocks/positioned-comment-list'

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
  const params = useParams()
  const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0)
  const [isCommentBeingCreated, setIsCommentBeingCreated] = useState(false)

  // 暴露刷新评论的函数到全局
  useEffect(() => {
    const refreshComments = () => {
      setCommentRefreshTrigger((prev) => prev + 1)
    }

    const setCommentCreationFlag = (flag: boolean) => {
      setIsCommentBeingCreated(flag)
    }

    const getCurrentEditorContent = () => {
      try {
        return JSON.stringify(editor.document, null, 2)
      } catch (error) {
        console.error('Failed to get current editor content:', error)
        return null
      }
    }

    // 将函数绑定到window对象
    ;(window as any).refreshComments = refreshComments
    ;(window as any).setCommentCreationFlag = setCommentCreationFlag
    ;(window as any).getCurrentEditorContent = getCurrentEditorContent

    return () => {
      delete (window as any).refreshComments
      delete (window as any).setCommentCreationFlag
      delete (window as any).getCurrentEditorContent
    }
  }, []) // editor在这个useEffect中被定义，不需要作为依赖

  const handleUpload = useCallback(async (file: File) => {
    const res = await imageApi.upload({
      file,
    })
    return res
  }, [])

  // 使用useState确保编辑器实例只创建一次
  const [editor] = useState(() => {
    return BlockNoteEditor.create({
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
  // Load commented blocks and set up block deletion listener
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

    // Set up listener for block deletion to clean up orphaned comments
    let lastDocumentChangeTime = 0
    const handleDocumentChange = async () => {
      // 如果正在创建评论，跳过此次检查
      if (isCommentBeingCreated) {
        return
      }

      // 防止频繁触发，特别是在评论创建后
      const now = Date.now()
      if (now - lastDocumentChangeTime < 1000) {
        return
      }
      lastDocumentChangeTime = now

      try {
        const allBlocks = editor.document
        const currentBlockIds = new Set(allBlocks.map((block) => block.id))

        // Fetch all comments for this document
        const response = await fetch(
          `/api/comments?documentId=${params.documentId}`
        )
        if (response.ok) {
          const comments = await response.json()

          // Find comments with blocks that no longer exist
          const orphanedComments = comments.filter(
            (comment: any) => !currentBlockIds.has(comment.blockId)
          )

          // Delete orphaned comments
          for (const comment of orphanedComments) {
            try {
              await fetch(`/api/comments?id=${comment.id}`, {
                method: 'DELETE',
              })
            } catch (error) {
              console.error('Error deleting orphaned comment:', error)
            }
          }

          // Refresh comment list if any comments were deleted
          if (orphanedComments.length > 0) {
            setCommentRefreshTrigger((prev) => prev + 1)
          }
        }
      } catch (error) {
        console.error('Error cleaning up orphaned comments:', error)
      }
    }

    if (params.documentId) {
      loadComments()

      // Add document change listener using onChange
      const unsubscribe = editor.onChange(handleDocumentChange)

      return unsubscribe
    }
  }, [params.documentId, editor])

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
    <div className="grid min-h-full grid-cols-[1fr,300px] gap-4">
      <div className="min-h-full">
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
      <div className="flex min-h-full flex-col border-l">
        <div className="relative flex-1">
          <PositionedCommentList
            editor={editor}
            refreshTrigger={commentRefreshTrigger}
          />
        </div>
      </div>
    </div>
  )
}

export default Editor
