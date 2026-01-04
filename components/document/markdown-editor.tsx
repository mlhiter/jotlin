'use client'

import { marked } from 'marked'
import { useMemo } from 'react'
import TurndownService from 'turndown'

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'

import './markdown-editor.scss'

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '_',
  strongDelimiter: '**',
})

interface MarkdownEditorProps {
  initialContent: string
  onChange: (markdown: string) => void
}

export function MarkdownEditor({ initialContent, onChange }: MarkdownEditorProps) {
  const html = useMemo(() => {
    if (!initialContent) return ''
    try {
      return marked(initialContent) as string
    } catch (error) {
      console.error('Failed to parse markdown:', error)
      return initialContent
    }
  }, [initialContent])

  const handleChange = (html: string) => {
    try {
      const markdown = turndown.turndown(html)
      onChange(markdown)
    } catch (error) {
      console.error('Failed to convert to markdown:', error)
      onChange(html)
    }
  }

  return <SimpleEditor initialContent={html} onChange={handleChange} />
}
