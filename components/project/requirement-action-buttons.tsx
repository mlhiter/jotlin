'use client'

import { ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { GenerationLog, LogEntry } from '@/components/mvp/generation-log'
import { Button } from '@/components/ui/button'

import apiClient from '@/libs/utils/axios'
import { useAuthStore } from '@/store/auth-store'

interface RequirementActionButtonsProps {
  rootChatId: string
  requirementContent: string
  onNextPhase: () => void
  onGenerateSuccess: () => void
}

export function RequirementActionButtons({
  rootChatId,
  requirementContent,
  onNextPhase,
  onGenerateSuccess,
}: RequirementActionButtonsProps) {
  const router = useRouter()
  const [isLoadingNextPhase, setIsLoadingNextPhase] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = (type: LogEntry['type'], message: string, fileName?: string) => {
    setLogs((prev) => [...prev, { type, message, timestamp: Date.now(), fileName }])
  }

  const handleNextPhase = async () => {
    setIsLoadingNextPhase(true)
    try {
      await apiClient.post(`/api/projects/${rootChatId}/next-phase`, {
        currentPhase: 'REQUIREMENT',
      })

      toast.success('Successfully started Architecture phase')
      router.push(`/chat/${rootChatId}`)
      onNextPhase()
    } catch (error) {
      console.error('Failed to start next phase:', error)
      toast.error('Failed to start next phase')
      setIsLoadingNextPhase(false)
    }
  }

  const handleDirectGenerate = async () => {
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
      // NOTE: axios does not support SSE, so use fetch
      // eslint-disable-next-line no-restricted-globals
      const response = await fetch('/api/mvp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requirements: requirementContent,
          architecture: '',
          developmentPlan: '',
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
                shouldStop = true
                setTimeout(() => {
                  onGenerateSuccess()
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
      if (reader) {
        try {
          reader.releaseLock()
        } catch {
          // Ignore
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
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-green-900 dark:text-green-100">✓ Requirements completed</p>
          <p className="text-xs text-green-700 dark:text-green-300">Choose your next action</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleDirectGenerate}
            disabled={isGenerating || isLoadingNextPhase}
            size="sm"
            className="flex-1 gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Code Directly
              </>
            )}
          </Button>

          <Button
            onClick={handleNextPhase}
            disabled={isGenerating || isLoadingNextPhase}
            size="sm"
            variant="outline"
            className="flex-1 gap-2">
            {isLoadingNextPhase ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Continue with Architecture
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
