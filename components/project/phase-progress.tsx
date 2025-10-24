'use client'

import { CheckCircle2, Circle, CircleDot } from 'lucide-react'

interface PhaseProgressProps {
  phases: Array<{
    phase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT'
    status: 'completed' | 'in-progress' | 'pending'
  }>
}

export function PhaseProgress({ phases }: PhaseProgressProps) {
  const getPhaseLabel = (phase: string) => {
    if (phase === 'REQUIREMENT') return 'Requirements'
    if (phase === 'ARCHITECTURE') return 'Architecture'
    if (phase === 'DEVELOPMENT') return 'Development'
    return phase
  }

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return 'Completed'
    if (status === 'in-progress') return 'In Progress'
    if (status === 'pending') return 'Not Started'
    return status
  }

  return (
    <div className="flex w-full justify-center overflow-hidden px-2 py-2 md:px-6">
      <div className="flex min-w-0 items-center gap-1.5 md:gap-2 lg:gap-3">
          {phases.map((phase, index) => (
            <div key={phase.phase} className="flex min-w-0 items-center gap-1.5 md:gap-2 lg:gap-3">
              {/* Phase status */}
              <div className="flex min-w-0 items-center gap-1 md:gap-1.5 lg:gap-2">
                {phase.status === 'completed' && <CheckCircle2 className="h-4 w-4 shrink-0 md:h-5 md:w-5 text-green-600 dark:text-green-500" />}
                {phase.status === 'in-progress' && <CircleDot className="h-4 w-4 shrink-0 md:h-5 md:w-5 text-primary" />}
                {phase.status === 'pending' && <Circle className="h-4 w-4 shrink-0 md:h-5 md:w-5 text-muted-foreground/50" />}
                <div className="flex min-w-0 flex-col">
                  <span
                    className={`truncate text-xs md:text-sm font-medium ${
                      phase.status === 'completed'
                        ? 'text-foreground'
                        : phase.status === 'in-progress'
                          ? 'text-primary'
                          : 'text-muted-foreground/50'
                    }`}>
                    {getPhaseLabel(phase.phase)}
                  </span>
                  <span
                    className={`truncate text-[10px] md:text-xs ${
                      phase.status === 'completed'
                        ? 'text-muted-foreground'
                        : phase.status === 'in-progress'
                          ? 'text-primary/70'
                          : 'text-muted-foreground/40'
                    }`}>
                    {getStatusLabel(phase.status)}
                  </span>
                </div>
              </div>

              {/* Connector line */}
              {index < phases.length - 1 && (
                <div className={`h-0.5 w-4 md:w-8 lg:w-12 shrink-0 transition-colors ${phase.status === 'completed' ? 'bg-green-600 dark:bg-green-500' : 'bg-border'}`} />
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
