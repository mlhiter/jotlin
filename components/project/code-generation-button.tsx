'use client'

import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { useAuthStore } from '@/store/auth-store'

import { GenerationLog, LogEntry } from '../mvp/generation-log'
import { GenerationProgress } from '../mvp/generation-progress'

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
  const t = useTranslations('project')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = (type: LogEntry['type'], message: string, fileName?: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: Date.now(), fileName }])
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setIsExpanded(true)
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

              if (data.progress !== undefined) {
                setProgress(data.progress)
              }

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

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">✓ {t('developmentPlanCompleted')}</p>
          <p className="text-xs text-green-700 dark:text-green-300">{t('readyToGenerateCode')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {logs.length > 0 && !isGenerating && (
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          <Button onClick={handleGenerate} disabled={isGenerating} size="sm" className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t('generateCode')}
              </>
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {isGenerating && (
              <div className="h-96 overflow-hidden lg:col-span-1">
                <GenerationProgress progress={progress} currentStep={currentStep} />
              </div>
            )}
            {logs.length > 0 && (
              <div className={`h-96 overflow-hidden ${isGenerating ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
                <GenerationLog logs={logs} isGenerating={isGenerating} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
