'use client'

import { ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import apiClient from '@/libs/utils/axios'

interface NextPhaseButtonProps {
  rootChatId: string
  currentPhase: 'DISCOVERY' | 'FEATURE_BENCHMARK' | 'MARKET_POSITIONING'
  finalDocument: string
  onSuccess: () => void
}

export function NextPhaseButton({ rootChatId, currentPhase, finalDocument, onSuccess }: NextPhaseButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleStartNextPhase = async () => {
    setIsLoading(true)
    try {
      await apiClient.post(`/api/projects/${rootChatId}/next-phase`, {
        currentPhase,
        finalDocument,
      })

      toast.success('Successfully started next phase')

      // Navigate to the root chat with a flag to trigger initial message
      router.push(`/chat/${rootChatId}`)

      onSuccess()
    } catch (error) {
      console.error('Failed to start next phase:', error)
      toast.error('Failed to start next phase')
      setIsLoading(false)
    }
  }

  const nextPhaseName =
    currentPhase === 'DISCOVERY' ? 'Feature Benchmarking' :
    currentPhase === 'FEATURE_BENCHMARK' ? 'Market Positioning' :
    ''

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/20">
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">✓ Document completed</p>
          <p className="text-xs text-green-700 dark:text-green-300">Ready to start {nextPhaseName} phase</p>
        </div>
        <Button onClick={handleStartNextPhase} disabled={isLoading} size="sm" className="shrink-0 gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              Start {nextPhaseName}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
