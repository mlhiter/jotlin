'use client'

import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { useAuthStore } from '@/store/auth-store'

import { GenerationLog, LogEntry } from '../mvp/generation-log'

interface CodeGenerationButtonProps {
  documents: {
    requirement?: { content: string }
    architecture?: { content: string }
    development?: { content: string }
  }
  rootChatId: string
  onSuccess: () => void
}

export function CodeGenerationButton({ documents, rootChatId, onSuccess }: CodeGenerationButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = (type: LogEntry['type'], message: string, fileName?: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: Date.now(), fileName }])
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
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
          requirements: documents.requirement?.content || '',
          architecture: documents.architecture?.content || '',
          developmentPlan: documents.development?.content || '',
          chatId: rootChatId,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to start generation'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      if (!response.body) {
        throw new Error('Response body is empty')
      }

      reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

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

              if (data.type === 'completed') {
                toast.success('Code generated successfully!')
                setIsGenerating(false)
                onSuccess()
                break
              }

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
      if (reader) {
        try {
          await reader.cancel()
        } catch (err) {
          console.error('[Reader Cleanup Error]', err)
        }
      }
    }
  }

  if (isGenerating || logs.length > 0) {
    return (
      <div className="animate-in fade-in slide-in-from-top-4 h-96 duration-500">
        <GenerationLog logs={logs} isGenerating={isGenerating} currentStep={currentStep} />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border border-green-200 bg-green-50 p-4 duration-300 dark:border-green-900/50 dark:bg-green-950/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">✓ Development plan completed</p>
          <p className="text-xs text-green-700 dark:text-green-300">Ready to generate code</p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate Code
        </Button>
      </div>
    </div>
  )
}
