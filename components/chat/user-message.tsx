'use client'

import { RotateCcw, TextAlignStart } from 'lucide-react'

import { Button } from '../ui/button'

interface UserMessageProps {
  content: string
  onRollback: () => void
}

export function UserMessage({ content, onRollback }: UserMessageProps) {
  const extractQuotes = () => {
    const quotes: string[] = []
    let remainingContent = content

    const quoteRegex = /^(<quote>[\s\S]*?<\/quote>\n?)+/
    const quotesMatch = remainingContent.match(quoteRegex)

    if (quotesMatch) {
      const individualQuoteRegex = /<quote>([\s\S]*?)<\/quote>/g
      let match
      while ((match = individualQuoteRegex.exec(quotesMatch[0])) !== null) {
        quotes.push(match[1].trim())
      }

      remainingContent = remainingContent.replace(quotesMatch[0], '').trim()
    }

    return { quotes, text: remainingContent }
  }

  const { quotes, text } = extractQuotes()

  return (
    <div className="flex max-w-[85%] flex-col items-end space-y-2">
      <div className="bg-muted text-foreground w-fit min-w-8 rounded-xl border-none p-2.5 shadow-none">
        {quotes.length > 0 && (
          <div>
            {quotes.map((quote, index) => (
              <div key={`quote-${index}`} className="flex items-center gap-2">
                <TextAlignStart className="text-accent-foreground/70 h-4 w-4 flex-shrink-0" />
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
        className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
        title="Rollback to this message">
        <RotateCcw className="mr-1 h-4 w-4" />
        Rollback
      </Button>
    </div>
  )
}
