'use client'

import { CheckCircle2, Loader2, FileText, AlertCircle, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { ScrollArea } from '@/components/ui/scroll-area'

export interface LogEntry {
  type: 'file_created' | 'step' | 'info' | 'error'
  message: string
  timestamp: number
  fileName?: string
}

interface GenerationLogProps {
  logs: LogEntry[]
  isGenerating: boolean
  currentStep?: string
}

export function GenerationLog({ logs, isGenerating, currentStep }: GenerationLogProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logs.length > 0 && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        requestAnimationFrame(() => {
          viewport.scrollTop = viewport.scrollHeight
        })
      }
    }
  }, [logs.length])

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const fileCount = logs.filter((l) => l.type === 'file_created').length
  const elapsedTime =
    logs.length > 1 ? ((logs[logs.length - 1]?.timestamp - logs[0]?.timestamp) / 1000).toFixed(1) : '0.0'

  return (
    <div className="border-border bg-card/50 min-w-xl flex h-full flex-col overflow-hidden rounded-lg border backdrop-blur-sm">
      <div className="border-border bg-muted/30 shrink-0 border-b px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary h-3.5 w-3.5" />
            <h3 className="text-foreground text-sm font-medium">Generation Progress</h3>
          </div>
          {isGenerating && (
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Loader2 className="text-primary h-3 w-3 animate-spin" />
              <span className="animate-pulse">Generating</span>
            </div>
          )}
        </div>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <div className="space-y-1 p-3 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-muted-foreground flex w-full items-center gap-2 py-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting to start generation...</span>
            </div>
          ) : (
            <>
              {logs.map((log, index) => {
                const isLatest = index === logs.length - 1 && isGenerating

                return (
                  <div
                    key={index}
                    className={`flex min-w-0 items-start gap-2 rounded px-2 py-1.5 transition-colors ${
                      isLatest ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}>
                    <span className="text-muted-foreground/70 mt-0.5 shrink-0 text-[10px] tabular-nums">
                      {formatTimestamp(log.timestamp)}
                    </span>

                    {log.type === 'file_created' && (
                      <>
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-500" />
                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                          <span className="text-muted-foreground shrink-0">Created</span>
                          <code className="bg-primary/10 text-primary truncate rounded px-1.5 py-0.5 text-[11px]">
                            {log.fileName}
                          </code>
                        </div>
                      </>
                    )}

                    {log.type === 'step' && (
                      <>
                        <span className="text-muted-foreground min-w-0 break-words">{log.message}</span>
                      </>
                    )}

                    {log.type === 'info' && (
                      <>
                        <FileText className="text-primary/70 mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="text-foreground/90 min-w-0 break-words">{log.message}</span>
                      </>
                    )}

                    {log.type === 'error' && (
                      <>
                        <AlertCircle className="text-destructive mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="text-destructive min-w-0 break-words">{log.message}</span>
                      </>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </ScrollArea>

      {logs.length > 0 && (
        <div className="border-border bg-muted/20 shrink-0 border-t px-4 py-2">
          <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
            <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
              📝 <span className="truncate">{currentStep || 'Processing...'}</span>
            </span>
            <span className="text-muted-foreground/50 shrink-0">•</span>
            <span className="shrink-0 tabular-nums">{fileCount} files</span>
            {logs.length > 1 && (
              <>
                <span className="text-muted-foreground/50 shrink-0">•</span>
                <span className="shrink-0 tabular-nums">{elapsedTime}s</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
