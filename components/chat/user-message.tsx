'use client'

import { TextAlignStart } from 'lucide-react'

interface UserMessageProps {
  content: string
}

export function UserMessage({ content }: UserMessageProps) {
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
    <div className="space-y-2">
      {quotes.length > 0 && (
        <div>
          {quotes.map((quote, index) => (
            <div key={`quote-${index}`} className="flex items-center gap-2">
              <TextAlignStart className="h-4 w-4 flex-shrink-0 text-accent-foreground/70" />
              <div className="truncate text-sm leading-relaxed text-muted-foreground">{quote}</div>
            </div>
          ))}
        </div>
      )}
      {text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>}
    </div>
  )
}
