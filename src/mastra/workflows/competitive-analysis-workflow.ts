import { discoveryAgent } from '../agents/discovery-agent'
import { featureAnalysisAgent } from '../agents/feature-analysis-agent'
import { marketResearchAgent } from '../agents/market-research-agent'
import { strategyAgent } from '../agents/strategy-agent'
import { synthesisAgent } from '../agents/synthesis-agent'

export async function runCompetitiveAnalysisWorkflow(productIdea: string) {
  try {
    const discoveryResult = await discoveryAgent.generate(
      `Analyze competitors for this product idea: ${productIdea}`
    )

    const [featureAnalysisResult, marketResearchResult] = await Promise.all([
      featureAnalysisAgent.generate(
        `Analyze features for these competitors:\n${JSON.stringify(discoveryResult, null, 2)}`
      ),
      marketResearchAgent.generate(
        `Conduct market research for these competitors:\n${JSON.stringify(discoveryResult, null, 2)}`
      ),
    ])

    const strategyResult = await strategyAgent.generate(`
Based on competitive analysis:

Discovery:
${JSON.stringify(discoveryResult, null, 2)}

Feature Analysis:
${JSON.stringify(featureAnalysisResult, null, 2)}

Market Research:
${JSON.stringify(marketResearchResult, null, 2)}

Provide strategic recommendations for the product: ${productIdea}
    `)

    const synthesisResult = await synthesisAgent.generate(`
Synthesize complete competitive intelligence report:

Discovery Phase:
${JSON.stringify(discoveryResult, null, 2)}

Feature Analysis:
${JSON.stringify(featureAnalysisResult, null, 2)}

Market Research:
${JSON.stringify(marketResearchResult, null, 2)}

Strategy Recommendations:
${JSON.stringify(strategyResult, null, 2)}

Product Idea: ${productIdea}
    `)

    return {
      discovery: discoveryResult,
      featureAnalysis: featureAnalysisResult,
      marketResearch: marketResearchResult,
      strategy: strategyResult,
      synthesis: synthesisResult,
    }
  } catch (error) {
    console.error('[Competitive Analysis Workflow Error]', error)
    throw error
  }
}

export const competitiveAnalysisWorkflow = {
  name: 'competitive-analysis',
  execute: runCompetitiveAnalysisWorkflow,
}
