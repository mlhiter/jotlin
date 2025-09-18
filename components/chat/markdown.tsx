'use client'

import { Copy, Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

interface MarkdownProps {
  content: string
  className?: string
  inline?: boolean
}

export function Markdown({ content, className, inline = false }: MarkdownProps) {
  const { theme } = useTheme()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedCode(text)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className={cn(inline ? '' : 'prose prose-sm max-w-none prose-neutral dark:prose-invert', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const codeContent = String(children).replace(/\n$/, '')

            const isInlineCode = !className || (!match && !codeContent.includes('\n'))

            if (isInlineCode || inline) {
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm" {...props}>
                  {codeContent}
                </code>
              )
            }
            return (
              <div className="group relative">
                <div className="flex items-center justify-between rounded-t-lg border bg-muted px-4 py-2">
                  <span className="text-xs font-medium text-muted-foreground">{language}</span>
                  <button
                    onClick={() => copyToClipboard(codeContent)}
                    className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background"
                    type="button">
                    {copiedCode === codeContent ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <SyntaxHighlighter
                  style={theme === 'dark' ? oneDark : oneLight}
                  language={language}
                  PreTag="div"
                  className="!mt-0 !rounded-t-none">
                  {codeContent}
                </SyntaxHighlighter>
              </div>
            )
          },
          pre({ children }) {
            return <>{children}</>
          },
          blockquote({ children }) {
            return <blockquote className="border-l-4 border-primary pl-4 italic">{children}</blockquote>
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-border">{children}</table>
              </div>
            )
          },
          th({ children }) {
            return <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">{children}</th>
          },
          td({ children }) {
            return <td className="border border-border px-4 py-2">{children}</td>
          },
        }}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
