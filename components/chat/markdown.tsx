'use client'

import { Check, Copy } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'

import { cn } from '@/libs/utils/utils'

import { Button } from '../ui/button'

import { MermaidChart } from './mermaid-chart'

interface MarkdownProps {
  content: string
  className?: string
  inline?: boolean
  hideMermaid?: boolean
}

export function Markdown({ content, className, inline = false, hideMermaid = false }: MarkdownProps) {
  const { theme } = useTheme()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedCode(text)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className={cn(inline ? '' : 'prose prose-sm prose-neutral dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const codeContent = String(children)

            const isInlineCode = !codeContent.includes('\n')

            if (isInlineCode || inline) {
              return (
                <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm" {...props}>
                  {codeContent}
                </code>
              )
            }

            if (language === 'mermaid') {
              if (hideMermaid) {
                return (
                  <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-center">
                    <p className="text-muted-foreground text-sm">📊 Chart generated - view in document panel →</p>
                  </div>
                )
              }
              return <MermaidChart code={codeContent} />
            }

            return (
              <div className="group relative">
                <div className="bg-muted flex items-center justify-between rounded-t-lg px-2 py-1">
                  <span className="text-muted-foreground text-xs font-medium">{language}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(codeContent)}
                    className="h-8 w-8 hover:bg-neutral-300"
                    title="Copy code">
                    {copiedCode === codeContent ? (
                      <Check className="text-muted-foreground h-2 w-2" />
                    ) : (
                      <Copy className="text-muted-foreground h-2 w-2" />
                    )}
                  </Button>
                </div>
                <SyntaxHighlighter
                  style={theme === 'dark' ? oneDark : oneLight}
                  language={language}
                  PreTag="div"
                  className="!mt-0 !rounded-b-lg !rounded-t-none border border-neutral-200">
                  {codeContent}
                </SyntaxHighlighter>
              </div>
            )
          },
          pre({ children }) {
            return <>{children}</>
          },
          blockquote({ children }) {
            return <blockquote className="border-primary border-l-4 pl-4 italic">{children}</blockquote>
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className="border-border min-w-full border-collapse border">{children}</table>
              </div>
            )
          },
          th({ children }) {
            return <th className="border-border bg-muted border px-4 py-2 text-left font-semibold">{children}</th>
          },
          td({ children }) {
            return <td className="border-border border px-4 py-2">{children}</td>
          },
        }}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
