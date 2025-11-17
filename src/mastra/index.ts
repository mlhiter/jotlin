import { Mastra } from '@mastra/core/mastra'

import { discoveryAgent } from './agents/discovery-agent'
import { featureAnalysisAgent } from './agents/feature-analysis-agent'
import { marketResearchAgent } from './agents/market-research-agent'
import { strategyAgent } from './agents/strategy-agent'
import { synthesisAgent } from './agents/synthesis-agent'
import { competitiveAnalysisWorkflow } from './workflows/competitive-analysis-workflow'

export const mastra = new Mastra({
  agents: {
    discoveryAgent,
    featureAnalysisAgent,
    marketResearchAgent,
    strategyAgent,
    synthesisAgent,
  },

  server: {
    port: process.env.MASTRA_PORT ? parseInt(process.env.MASTRA_PORT) : 4111,
  },
})

export { discoveryAgent, featureAnalysisAgent, marketResearchAgent, strategyAgent, synthesisAgent }

export { competitiveAnalysisWorkflow }
