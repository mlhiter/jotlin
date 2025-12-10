'use client'

import { Check, Loader2, FileText, FileCode, Workflow, Map, Layout } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/libs/utils/utils'

interface GenerationStep {
  label: string
  icon: typeof FileText
  status: 'pending' | 'processing' | 'completed' | 'error'
}

interface GenerationProgressDialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  steps: GenerationStep[]
  currentStep?: number
  totalSteps?: number
}

export function GenerationProgressDialog({
  open,
  onOpenChange,
  steps,
  currentStep = 0,
  totalSteps = 4,
}: GenerationProgressDialogProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Generating Documents</DialogTitle>
          <DialogDescription>Please wait while AI generates your product documents...</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps list */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-all',
                  step.status === 'processing' && 'border-primary bg-primary/5',
                  step.status === 'completed' && 'border-green-500/50 bg-green-500/5',
                  step.status === 'error' && 'border-destructive/50 bg-destructive/5'
                )}>
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {step.status === 'pending' && (
                    <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                      <step.icon className="text-muted-foreground h-4 w-4" />
                    </div>
                  )}
                  {step.status === 'processing' && (
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                      <Loader2 className="text-primary h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {step.status === 'completed' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  )}
                  {step.status === 'error' && (
                    <div className="bg-destructive/10 flex h-8 w-8 items-center justify-center rounded-full">
                      <span className="text-destructive text-sm font-bold">!</span>
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      step.status === 'pending' && 'text-muted-foreground',
                      step.status === 'processing' && 'text-foreground',
                      step.status === 'completed' && 'text-green-600 dark:text-green-400',
                      step.status === 'error' && 'text-destructive'
                    )}>
                    {step.label}
                  </p>
                  {step.status === 'processing' && (
                    <p className="text-muted-foreground mt-0.5 text-xs">Generating...</p>
                  )}
                  {step.status === 'completed' && <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">Completed</p>}
                  {step.status === 'error' && <p className="text-destructive mt-0.5 text-xs">Failed</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Estimated time */}
          {currentStep < totalSteps && (
            <div className="text-muted-foreground rounded-lg bg-muted p-3 text-center text-xs">
              Estimated time remaining: ~{Math.max(0, (totalSteps - currentStep) * 15)} seconds
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Default steps configuration
export const DEFAULT_GENERATION_STEPS: GenerationStep[] = [
  {
    label: 'Product Requirements Document (PRD)',
    icon: FileCode,
    status: 'pending',
  },
  {
    label: 'Business Flowchart',
    icon: Workflow,
    status: 'pending',
  },
  {
    label: 'Site Structure Map',
    icon: Map,
    status: 'pending',
  },
  {
    label: 'UI Wireframe',
    icon: Layout,
    status: 'pending',
  },
]
