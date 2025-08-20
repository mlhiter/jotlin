'use client'

import { useCreateBlockNote } from '@blocknote/react'
import JSZip from 'jszip'
import { Download, Copy, Archive } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { documentApi } from '@/api/document'
import { Doc } from '@/types/document'

interface ChatExportMenuProps {
  chatId: string
  chatTitle?: string
  chatDescription?: string
  documents: Doc[]
  disabled?: boolean
}

const ChatExportMenu = ({
  chatId,
  chatTitle,
  chatDescription,
  documents,
  disabled = false,
}: ChatExportMenuProps) => {
  const [isExporting, setIsExporting] = useState(false)
  const editor = useCreateBlockNote()

  const convertBlocksToMarkdown = async (
    content: string,
    title: string
  ): Promise<string> => {
    try {
      if (!content) {
        return `# ${title}\n\n*This document is empty.*\n`
      }

      const blocks = JSON.parse(content)
      if (!Array.isArray(blocks) || blocks.length === 0) {
        return `# ${title}\n\n*This document is empty.*\n`
      }

      const markdownContent = await editor.blocksToMarkdownLossy(blocks)
      return `# ${title}\n\n${markdownContent}\n`
    } catch (error) {
      console.error('Failed to convert blocks to markdown:', error)
      return `# ${title}\n\n*Failed to convert document content.*\n`
    }
  }

  const fetchDocumentContent = async (doc: Doc): Promise<string> => {
    try {
      const fullDocument = await documentApi.getById(doc.id)
      return await convertBlocksToMarkdown(
        fullDocument.content || '',
        doc.title || 'Untitled'
      )
    } catch (error) {
      console.error(`Failed to fetch document ${doc.id}:`, error)
      return `# ${doc.title || 'Untitled'}\n\n*Failed to fetch document content.*\n`
    }
  }

  const createSummaryHeader = (): string => {
    const title = chatTitle || `Chat ${chatId}`
    const description = chatDescription
      ? `\n\n**Description:** ${chatDescription}`
      : ''
    const timestamp = new Date().toLocaleString()

    return `# ${title}${description}

## Export Summary

**Generated on:** ${timestamp}
**Total documents:** ${documents.length}
**Export type:** Combined Markdown

**Documents included:**
${documents.map((doc, index) => `${index + 1}. **${doc.title || 'Untitled'}**`).join('\n')}

---

## Document Contents

`
  }

  const handleCopyToClipboard = async () => {
    if (disabled || documents.length === 0) {
      toast.error('No documents to export')
      return
    }

    setIsExporting(true)
    const loadingToast = toast.loading('Preparing documents for export...')
    try {
      const markdownContents: string[] = []

      for (const doc of documents) {
        const markdown = await fetchDocumentContent(doc)
        markdownContents.push(markdown)
      }

      // 创建总结性前置文本
      const summaryHeader = createSummaryHeader()
      const combinedMarkdown =
        summaryHeader + markdownContents.join('\n---\n\n')

      await navigator.clipboard.writeText(combinedMarkdown)
      toast.success(`Copied ${documents.length} documents to clipboard`)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.error('Failed to copy to clipboard')
    } finally {
      setIsExporting(false)
      toast.dismiss(loadingToast)
    }
  }

  const handleDownloadZip = async () => {
    if (disabled || documents.length === 0) {
      toast.error('No documents to export')
      return
    }

    setIsExporting(true)
    const loadingToast = toast.loading('Preparing documents for download...')
    try {
      const zip = new JSZip()

      for (const doc of documents) {
        const markdown = await fetchDocumentContent(doc)
        const filename = `${(doc.title || 'Untitled').replace(/[<>:"/\\|?*]/g, '_')}.md`
        zip.file(filename, markdown)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-${chatId}-documents.zip`
      a.click()
      URL.revokeObjectURL(url)

      toast.success(`Downloaded ${documents.length} documents as ZIP`)
    } catch (error) {
      console.error('Failed to download ZIP:', error)
      toast.error('Failed to download ZIP file')
    } finally {
      toast.dismiss(loadingToast)
      setIsExporting(false)
    }
  }

  if (!documents || documents.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || isExporting}
          className="text-sm text-muted-foreground hover:text-foreground">
          <Download className="mr-1 h-4 w-4" />
          Export Documents
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64"
        align="end"
        alignOffset={8}
        forceMount>
        <div className="p-2 text-xs text-muted-foreground">
          Export {documents.length} document{documents.length > 1 ? 's' : ''} as
          Markdown
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleCopyToClipboard}
          disabled={isExporting}>
          <Copy className="mr-2 h-4 w-4" />
          Copy to Clipboard
          <div className="ml-auto text-xs text-muted-foreground">
            With Summary
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadZip} disabled={isExporting}>
          <Archive className="mr-2 h-4 w-4" />
          Download as ZIP
          <div className="ml-auto text-xs text-muted-foreground">
            Separate files
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ChatExportMenu
