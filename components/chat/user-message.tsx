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
      <div>
        {quotes.map((quote, index) => (
          <div key={`quote-${index}`} className="flex items-center gap-2">
            <TextAlignStart className="h-4 w-4 text-accent-foreground/70 flex-shrink-0" />
            <div className="text-sm text-muted-foreground truncate leading-relaxed">{quote}</div>
          </div>
        ))}
      </div>

      {text && <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>}
    </div>
  )
}
