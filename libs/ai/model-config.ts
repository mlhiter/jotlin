export const AI_MODELS = {
  requirement: 'gemini-2.5-pro',
  architecture: 'gemini-2.5-pro',
  development: 'gemini-2.5-pro',
  codeGeneration: 'claude-sonnet-4-5-20250929',
} as const

export type AIPhase = keyof typeof AI_MODELS

export function getModelForPhase(phase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT' | null): string {
  if (phase === 'ARCHITECTURE') {
    return AI_MODELS.architecture
  } else if (phase === 'DEVELOPMENT') {
    return AI_MODELS.development
  }
  return AI_MODELS.requirement
}
