export const AI_MODELS = {
  discovery: 'gemini-2.5-pro',
  featureBenchmark: 'gemini-2.5-pro',
  marketPositioning: 'gemini-2.5-pro',
  recommendation: 'gemini-2.5-pro',
  codeGeneration: 'claude-sonnet-4-5-20250929',
} as const

export type AIPhase = keyof typeof AI_MODELS

export function getModelForPhase(
  phase: 'DISCOVERY' | 'FEATURE_BENCHMARK' | 'MARKET_POSITIONING' | 'RECOMMENDATION' | null
): string {
  if (phase === 'FEATURE_BENCHMARK') {
    return AI_MODELS.featureBenchmark
  } else if (phase === 'MARKET_POSITIONING') {
    return AI_MODELS.marketPositioning
  } else if (phase === 'RECOMMENDATION') {
    return AI_MODELS.recommendation
  }
  return AI_MODELS.discovery
}
