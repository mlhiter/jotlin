'use client'

import { RotateCcw, TextAlignStart, FileText, ImageIcon } from 'lucide-react'

import { Button } from '../ui/button'

export interface MessagePart {
  type: string
  text?: string
  image?: string | URL | ArrayBuffer | Uint8Array | Buffer
  data?: string | ArrayBuffer | Uint8Array | Buffer
  mimeType?: string
  url?: string
  filename?: string
}

interface UserMessageProps {
  parts: MessagePart[]
  onRollback: () => void
}

export function UserMessage({ parts, onRollback }: UserMessageProps) {
  const textPart = parts.find((p) => p.type === 'text')
  const content = (textPart && 'text' in textPart && textPart.text) || ''

  // Extract file markers and clean content
  const extractFilesAndQuotes = () => {
    const quotes: string[] = []
    const files: Array<{ name: string; type: 'image' | 'pdf' }> = []
    let remainingContent = content

    // Extract file markers like [Image: filename.png] or [PDF Document: filename.pdf]
    const imageRegex = /\[Image: ([^\]]+)\]\n(data:image\/[^;]+;base64,[^\s]+)/g
    const pdfRegex = /\[PDF Document: ([^\]]+)\]\n([\s\S]*?)(?=\n\n---|\n\n\[|$)/g

    let match

    // Extract images
    while ((match = imageRegex.exec(content)) !== null) {
      files.push({ name: match[1], type: 'image' })
    }

    // Extract PDFs
    while ((match = pdfRegex.exec(content)) !== null) {
      files.push({ name: match[1], type: 'pdf' })
    }

    // Remove file content from remaining text
    remainingContent = remainingContent
      .replace(imageRegex, '')
      .replace(pdfRegex, '')
      .replace(/\n\n---\n\n/g, '\n\n')
      .trim()

    // Extract quotes
    const quoteRegex = /^(<quote>[\s\S]*?<\/quote>\n?)+/
    const quotesMatch = remainingContent.match(quoteRegex)

    if (quotesMatch) {
      const individualQuoteRegex = /<quote>([\s\S]*?)<\/quote>/g
      let quoteMatch
      while ((quoteMatch = individualQuoteRegex.exec(quotesMatch[0])) !== null) {
        quotes.push(quoteMatch[1].trim())
      }

      remainingContent = remainingContent.replace(quotesMatch[0], '').trim()
    }

    return { quotes, files, text: remainingContent }
  }

  const { quotes, files, text } = extractFilesAndQuotes()

  return (
    <div className="flex max-w-[85%] flex-col items-end space-y-2">
      <div className="bg-muted/40 text-foreground w-fit min-w-8 rounded-lg p-2.5">
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={`file-${index}`}
                className="bg-background/50 flex items-center gap-2 rounded-md border border-border/40 px-3 py-2 transition-all duration-150">
                {file.type === 'image' ? (
                  <ImageIcon className="text-primary h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                ) : (
                  <FileText className="text-primary h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                )}
                <span className="text-foreground truncate text-xs font-medium">{file.name}</span>
              </div>
            ))}
          </div>
        )}

        {quotes.length > 0 && (
          <div>
            {quotes.map((quote, index) => (
              <div key={`quote-${index}`} className="flex items-center gap-2">
                <TextAlignStart className="text-accent-foreground/70 h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                <div className="text-muted-foreground truncate text-sm leading-relaxed">{quote}</div>
              </div>
            ))}
          </div>
        )}
        {text && <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRollback()}
        className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        title="Rollback to this message">
        <RotateCcw className="mr-1 h-3.5 w-3.5" strokeWidth={1.5} />
        Rollback
      </Button>
    </div>
  )
}
