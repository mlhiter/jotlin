'use client'

import { AlertTriangle, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import apiClient from '@/libs/utils/axios'
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
  const [hasExistingCode, setHasExistingCode] = useState(false)
  const [isCheckingCode, setIsCheckingCode] = useState(true)

  const addLog = (type: LogEntry['type'], message: string, fileName?: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: Date.now(), fileName }])
  }

  // Check if code already exists
  useEffect(() => {
    const checkExistingCode = async () => {
      try {
        const res = await apiClient.get(`/api/mvp/${rootChatId}`)
        if (res.data && res.data.files && Object.keys(res.data.files).length > 0) {
          setHasExistingCode(true)
        }
      } catch {
        // No existing code or error
        setHasExistingCode(false)
      } finally {
        setIsCheckingCode(false)
      }
    }

    checkExistingCode()
  }, [rootChatId])

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
      let shouldStop = false

      while (true) {
        const { done, value } = await reader.read()
        if (done || shouldStop) break

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
                setHasExistingCode(true)
                shouldStop = true
                // Call onSuccess and clear logs after a short delay
                setTimeout(() => {
                  onSuccess()
                  setLogs([])
                  setCurrentStep('')
                }, 1000)
                break
              }

              if (data.type === 'error') {
                const errorMsg = data.error || data.message || 'Generation failed'
                addLog('error', errorMsg)
                toast.error(errorMsg)
                setIsGenerating(false)
                shouldStop = true
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
      // Don't cancel the reader here - let it finish naturally
      // Calling reader.cancel() causes the backend to throw "terminated" error
      if (reader) {
        try {
          reader.releaseLock()
        } catch {
          // Ignore lock release errors
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

  if (isCheckingCode) {
    return (
      <div className="animate-in fade-in slide-in-from-top-2 bg-muted/50 rounded-lg border p-4 duration-300">
        <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span>Checking existing code...</span>
        </div>
      </div>
    )
  }

  if (hasExistingCode) {
    return (
      <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border border-amber-200 bg-amber-50 p-4 duration-300 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Code already exists</p>
            </div>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Regenerating will overwrite existing code. Check the Preview/Code tabs first.
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating} size="sm" className="gap-2" variant="outline">
            <Sparkles className="h-4 w-4" />
            Regenerate
          </Button>
        </div>
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
