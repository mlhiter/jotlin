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
}

export function GenerationLog({ logs, isGenerating }: GenerationLogProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm">
      <div className="border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Claude Agent Activity</h3>
          </div>
          {isGenerating && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="animate-pulse">Working...</span>
            </div>
          )}
        </div>
      </div>

      <ScrollArea ref={scrollAreaRef} className="h-[320px]">
        <div className="space-y-1 p-3 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="flex items-center gap-2 py-8 text-center text-muted-foreground">
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
                    className={`flex items-start gap-2 rounded px-2 py-1.5 transition-colors ${
                      isLatest ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}>
                    <span className="mt-0.5 text-[10px] text-muted-foreground/70 tabular-nums">
                      {formatTimestamp(log.timestamp)}
                    </span>

                    {log.type === 'file_created' && (
                      <>
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                        <div className="flex flex-1 items-center gap-1.5">
                          <span className="text-muted-foreground">Created</span>
                          <code className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                            {log.fileName}
                          </code>
                        </div>
                      </>
                    )}

                    {log.type === 'step' && (
                      <>
                        <span className="text-muted-foreground">{log.message}</span>
                      </>
                    )}

                    {log.type === 'info' && (
                      <>
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                        <span className="text-foreground/90">{log.message}</span>
                      </>
                    )}

                    {log.type === 'error' && (
                      <>
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                        <span className="text-destructive">{log.message}</span>
                      </>
                    )}
                  </div>
                )
              })}
              <div ref={logsEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {logs.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {isGenerating ? (
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  </span>
                  In progress...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Completed
                </span>
              )}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {logs.filter((l) => l.type === 'file_created').length} files
              {logs.length > 1 && ` · ${((logs[logs.length - 1]?.timestamp - logs[0]?.timestamp) / 1000).toFixed(1)}s`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
