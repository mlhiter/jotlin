'use client'

import { CheckCircle2, Circle, CircleDot } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface PhaseProgressProps {
  phases: Array<{
    phase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT'
    status: 'completed' | 'in-progress' | 'pending'
  }>
}

export function PhaseProgress({ phases }: PhaseProgressProps) {
  const t = useTranslations('project')

  const getPhaseLabel = (phase: string) => {
    if (phase === 'REQUIREMENT') return t('phaseRequirement')
    if (phase === 'ARCHITECTURE') return t('phaseArchitecture')
    if (phase === 'DEVELOPMENT') return t('phaseDevelopment')
    return phase
  }

  return (
    <div className="flex justify-center px-6 py-2">
      <div className="flex items-center gap-3">
          {phases.map((phase, index) => (
            <div key={phase.phase} className="flex items-center gap-3">
              {/* Phase status */}
              <div className="flex items-center gap-2">
                {phase.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {phase.status === 'in-progress' && <CircleDot className="h-5 w-5 text-blue-500" />}
                {phase.status === 'pending' && <Circle className="h-5 w-5 text-muted-foreground/50" />}
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-medium ${
                      phase.status === 'completed'
                        ? 'text-foreground'
                        : phase.status === 'in-progress'
                          ? 'text-blue-500'
                          : 'text-muted-foreground/50'
                    }`}>
                    {getPhaseLabel(phase.phase)}
                  </span>
                  <span
                    className={`text-xs ${
                      phase.status === 'completed'
                        ? 'text-muted-foreground'
                        : phase.status === 'in-progress'
                          ? 'text-blue-400'
                          : 'text-muted-foreground/40'
                    }`}>
                    {phase.status === 'completed' && t('statusCompleted')}
                    {phase.status === 'in-progress' && t('statusInProgress')}
                    {phase.status === 'pending' && t('statusPending')}
                  </span>
                </div>
              </div>

              {/* Connector line */}
              {index < phases.length - 1 && (
                <div className={`h-0.5 w-12 transition-colors ${phase.status === 'completed' ? 'bg-green-500' : 'bg-border'}`} />
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
