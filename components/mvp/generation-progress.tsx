'use client'

import { Check, Circle, Loader2 } from 'lucide-react'

import { Card } from '@/components/ui/card'

import { cn } from '@/libs/utils/utils'

interface GenerationProgressProps {
  progress: number
  currentStep: string
}

export function GenerationProgress({ progress, currentStep }: GenerationProgressProps) {
  const steps = [
    { id: 1, name: 'Analyzing requirements', threshold: 10 },
    { id: 2, name: 'Generating code', threshold: 40 },
    { id: 3, name: 'Creating files', threshold: 70 },
    { id: 4, name: 'Saving to database', threshold: 90 },
    { id: 5, name: 'Complete', threshold: 100 },
  ]

  const getStepStatus = (threshold: number) => {
    if (progress >= threshold) return 'completed'
    if (progress >= threshold - 10) return 'current'
    return 'pending'
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden p-4">
      <div className="mb-4 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Generating MVP with Claude</h3>
          <p className="text-xs text-muted-foreground">{currentStep}</p>
        </div>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 space-y-2">
        {steps.map((step) => {
          const status = getStepStatus(step.threshold)
          return (
            <div key={step.id} className="flex items-center gap-2">
              {status === 'completed' && <Check className="h-4 w-4 text-green-500" />}
              {status === 'current' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {status === 'pending' && <Circle className="h-4 w-4 text-muted-foreground/30" />}
              <span
                className={cn(
                  'text-sm',
                  status === 'completed' && 'text-green-600',
                  status === 'current' && 'font-medium text-foreground',
                  status === 'pending' && 'text-muted-foreground'
                )}>
                {step.name}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
