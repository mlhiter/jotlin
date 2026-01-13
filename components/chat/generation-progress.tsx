'use client'

import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

import { useGenerationProgress } from '@/hooks/use-generation-progress'
import { cn } from '@/libs/utils/utils'

interface GenerationProgressProps {
  requirementDocId: string | null
  onComplete?: () => void
  className?: string
}

export function GenerationProgress({ requirementDocId, onComplete, className }: GenerationProgressProps) {
  const { data, isLoading } = useGenerationProgress(requirementDocId)

  console.log('[GenerationProgress] Component rendered')
  console.log('[GenerationProgress] Requirement Doc ID:', requirementDocId)
  console.log('[GenerationProgress] Is Loading:', isLoading)
  console.log('[GenerationProgress] Data:', data)
  console.log('[GenerationProgress] Is Generating:', data?.isGenerating)

  if (isLoading || !data || !data.isGenerating) {
    if (data?.progress?.status === 'completed' && onComplete) {
      onComplete()
    }
    console.log('[GenerationProgress] Not showing (isLoading:', isLoading, 'hasData:', !!data, 'isGenerating:', data?.isGenerating, ')')
    return null
  }

  const progress = data.progress

  if (!progress) return null

  const isError = progress.status === 'error'
  const isCompleted = progress.status === 'completed'

  return (
    <div
      className={cn(
        'bg-card/60 border-border/40 flex items-start gap-3 rounded-lg border p-4 backdrop-blur-sm',
        className
      )}
    >
      {isError ? (
        <XCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
      ) : isCompleted ? (
        <CheckCircle2 className="text-green-500 mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <Loader2 className="text-primary mt-0.5 h-5 w-5 shrink-0 animate-spin" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-foreground text-sm font-medium">
            {isError ? 'Generation Failed' : isCompleted ? 'Generation Complete' : 'Generating Documents'}
          </p>
          <span className="text-muted-foreground text-xs">{progress.percentage}%</span>
        </div>

        <p className="text-muted-foreground mt-1 text-xs">{progress.currentStep}</p>

        {isError && progress.error && (
          <p className="text-destructive mt-2 text-xs font-medium">{progress.error}</p>
        )}

        {!isError && !isCompleted && (
          <div className="bg-muted mt-3 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all duration-300 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        )}

        {isCompleted && progress.generatedDocIds.length > 0 && (
          <p className="text-muted-foreground mt-2 text-xs">
            {progress.generatedDocIds.length} documents created successfully
          </p>
        )}
      </div>
    </div>
  )
}
