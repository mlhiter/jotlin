'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { useAuthStore } from '@/store/auth-store'

import { GenerationLog, LogEntry } from './generation-log'
import { GenerationProgress } from './generation-progress'

interface GenerateButtonProps {
  requirements: string
  chatId: string
  onSuccess: (data: { files: Record<string, string> }) => void
}

export function GenerateButton({ requirements, chatId, onSuccess }: GenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = (type: LogEntry['type'], message: string, fileName?: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: Date.now(), fileName }])
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setProgress(0)
    setLogs([])
    setCurrentStep('Initializing...')

    const token = useAuthStore.getState().token

    if (!token) {
      toast.error('Please login first')
      setIsGenerating(false)
      return
    }

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

    try {
      // Start generation with SSE
      // NOTE: axios is not support sse, so there use fetch
      // eslint-disable-next-line no-restricted-globals
      const response = await fetch('/api/mvp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requirements,
          chatId,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to start generation'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      if (!response.body) {
        throw new Error('Response body is empty')
      }

      // Read SSE stream
      reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              // Update progress
              if (data.progress !== undefined) {
                setProgress(data.progress)
              }

              // Add log entry - handle different event types
              if (data.type === 'step' || data.type === 'info') {
                if (data.message) {
                  addLog(data.type, data.message)
                  setCurrentStep(data.message)
                }
              } else if (data.type === 'file_created') {
                if (data.fileName) {
                  addLog('file_created', data.message || 'Created file', data.fileName)
                }
              }

              // Handle completion
              if (data.type === 'completed') {
                toast.success('MVP generated successfully!')
                if (data.files) {
                  onSuccess({ files: data.files })
                }
                setIsGenerating(false)
                break
              }

              // Handle error
              if (data.type === 'error') {
                addLog('error', data.error || data.message || 'Generation failed')
                toast.error(data.error || 'Generation failed')
                setIsGenerating(false)
                break
              }
            } catch (parseError) {
              console.error('[SSE Parse Error]', parseError, 'Line:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('[Generate Error]', error)
      const msg = error instanceof Error ? error.message : 'Generation failed'
      addLog('error', msg)
      toast.error(msg)
      setIsGenerating(false)
    } finally {
      // Clean up reader
      if (reader) {
        try {
          await reader.cancel()
        } catch (err) {
          console.error('[Reader Cleanup Error]', err)
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full" size="lg">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate MVP
          </>
        )}
      </Button>

      {isGenerating && <GenerationProgress progress={progress} currentStep={currentStep} />}

      {logs.length > 0 && <GenerationLog logs={logs} isGenerating={isGenerating} />}

      {!isGenerating && logs.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">Generate runnable prototype code from requirements</p>
      )}
    </div>
  )
}
