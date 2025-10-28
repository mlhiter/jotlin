'use client'

import { CheckCircle2, Circle, CircleDot } from 'lucide-react'

interface PhaseProgressProps {
  phases: Array<{
    phase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT'
    status: 'completed' | 'in-progress' | 'pending'
  }>
  currentPhase?: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT' | null
  onPhaseClick?: (phase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT') => void
  clickable?: boolean
}

export function PhaseProgress({ phases, currentPhase, onPhaseClick, clickable = false }: PhaseProgressProps) {
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

  const handlePhaseClick = (phase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT', status: string) => {
    if (clickable && onPhaseClick && status !== 'pending') {
      onPhaseClick(phase)
    }
  }

  return (
    <div className="flex w-full justify-center overflow-hidden px-2 py-2 md:px-6">
      <div className="flex min-w-0 items-center gap-1.5 md:gap-2 lg:gap-3">
        {phases.map((phase, index) => {
          const isActive = currentPhase === phase.phase
          const isClickable = clickable && phase.status !== 'pending'

          return (
            <div key={phase.phase} className="flex min-w-0 items-center gap-1.5 md:gap-2 lg:gap-3">
              {/* Phase status */}
              <button
                onClick={() => handlePhaseClick(phase.phase, phase.status)}
                disabled={!isClickable}
                className={`flex min-w-0 items-center gap-1 md:gap-1.5 lg:gap-2 ${
                  isClickable
                    ? 'cursor-pointer transition-opacity hover:opacity-80'
                    : phase.status === 'pending'
                      ? 'cursor-not-allowed'
                      : 'cursor-default'
                } ${isActive ? 'bg-accent/50 rounded-md px-2 py-1' : 'px-2 py-1'}`}>
                {phase.status === 'completed' && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 md:h-5 md:w-5 dark:text-green-500" />
                )}
                {phase.status === 'in-progress' && (
                  <CircleDot className="text-primary h-4 w-4 shrink-0 md:h-5 md:w-5" />
                )}
                {phase.status === 'pending' && (
                  <Circle className="text-muted-foreground/50 h-4 w-4 shrink-0 md:h-5 md:w-5" />
                )}
                <div className="flex min-w-0 flex-col">
                  <span
                    className={`truncate text-xs font-medium md:text-sm ${
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
              </button>

              {/* Connector line */}
              {index < phases.length - 1 && (
                <div
                  className={`h-0.5 w-4 shrink-0 transition-colors md:w-8 lg:w-12 ${phase.status === 'completed' ? 'bg-green-600 dark:bg-green-500' : 'bg-border'}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
