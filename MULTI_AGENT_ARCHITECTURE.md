# Jotlin Multi-Agent Architecture (Mastra.ai)

**Version:** 2.0 - Multi-Agent System
**Last Updated:** 2025-01-13
**Tech Stack:** Mastra.ai + Tavily + Vercel AI SDK + Gemini 2.5 Pro

---

## Executive Summary

Jotlin 采用**多 Agent 协作架构**,基于 Mastra.ai 框架实现专业化分工:
- **5个专业 Agent** - 每个 Agent 专注特定领域(发现、分析、市场、策略、综合)
- **并行执行** - 独立任务并发处理,分析速度提升 3-4x
- **工具增强** - 集成 Tavily Web Search、Product Hunt、Crunchbase API
- **流式响应** - 通过 Vercel AI SDK 实现实时进度更新

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Mastra Orchestration Layer                 │
│                  (Multi-Agent Coordination)                   │
└────────┬─────────────────────────────────────────────────────┘
         │
    ┌────┴───────────────────────────────────────┐
    │                                            │
┌───▼──────────────┐                  ┌─────────▼────────────┐
│  Discovery       │                  │  Market Research     │
│  Agent           │                  │  Agent               │
│  + Tavily Tool   │                  │                      │
└───┬──────────────┘                  └─────────┬────────────┘
    │                                            │
    │         ┌─────────────────────┐            │
    └────────►│  Feature Analysis   │◄───────────┘
              │  Agent              │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │  Strategy Agent     │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │  Synthesis Agent    │
              │  (Report Generator) │
              └─────────────────────┘
```

---

## Technology Stack

### Core Framework: Mastra.ai

```json
{
  "@mastra/core": "latest",
  "@mastra/ai-sdk": "latest",
  "@ai-sdk/react": "latest"
}
```

**为什么选择 Mastra:**
- ✅ Native TypeScript 支持
- ✅ 内置多 Agent 编排
- ✅ 与 Vercel AI SDK 无缝集成
- ✅ Tool 管理和 MCP 协议支持
- ✅ 结构化输出(Zod schema)

### AI Models

| Agent | Model | Reason |
|-------|-------|--------|
| Discovery | Gemini 2.5 Pro | 强推理能力,识别竞品 |
| Feature Analysis | Gemini 2.5 Pro | 结构化分析,功能拆解 |
| Market Research | Gemini 2.5 Pro | 数据分析,市场洞察 |
| Strategy | Gemini 2.5 Pro | 战略思维,综合判断 |
| Synthesis | Gemini 2.5 Pro | 文档生成,内容整合 |

### Tools & Integrations

```typescript
// Mastra Tools
- Tavily Search Tool (Web search)
- Product Hunt Tool (Product data)
- Crunchbase Tool (Funding data)
- Data Enrichment Tool (Merge data)
```

---

## Agent Definitions

### 1. Discovery Agent

**职责**: 识别竞品、分类、初步评估

```typescript
// src/mastra/agents/discovery-agent.ts
import { Agent } from '@mastra/core/agent'
import { tavilySearchTool } from '../tools/tavily-tool'
import { productHuntTool } from '../tools/product-hunt-tool'

export const discoveryAgent = new Agent({
  name: 'discovery-agent',
  model: 'google/gemini-2.5-pro',

  instructions: `
You are a competitive intelligence specialist with expertise in:
- Identifying direct, indirect, and adjacent competitors
- Understanding market categories and positioning
- Spotting emerging challengers

Your process:
1. Generate 5 search queries from different angles
2. Use Tavily to search the web
3. Extract competitor names from search results
4. Classify each competitor (direct/indirect/adjacent)
5. Assign confidence score (0-1)
6. Use Product Hunt to enrich data

Output format (JSON):
{
  "competitors": [
    {
      "name": "Notion",
      "type": "direct",
      "confidence": 0.95,
      "source": "web_search",
      "reasoning": "Same problem space, overlapping features"
    }
  ]
}
`,

  tools: {
    tavilySearch: tavilySearchTool,
    productHunt: productHuntTool,
  },

  maxSteps: 8, // 允许多步推理和工具调用
})
```

---

### 2. Feature Analysis Agent

**职责**: 深度功能拆解、质量评估

```typescript
// src/mastra/agents/feature-analysis-agent.ts
export const featureAnalysisAgent = new Agent({
  name: 'feature-analysis-agent',
  model: 'google/gemini-2.5-pro',

  instructions: `
You are a product analyst specializing in feature decomposition.

For EACH competitor, provide:
- 10-15 key features
- Category: table_stakes | differentiator | innovation
- Quality rating: excellent | good | basic | poor
- Implementation notes

Output format (JSON):
{
  "competitorName": "Notion",
  "features": [
    {
      "name": "Block-based editor",
      "category": "differentiator",
      "quality": "excellent",
      "description": "Drag-and-drop blocks with rich media",
      "technicalApproach": "Custom CRDT for real-time sync"
    }
  ],
  "strengths": ["..."],
  "weaknesses": ["..."]
}
`,

  tools: {},
  maxSteps: 3,
})
```

---

### 3. Market Research Agent

**职责**: 定价、市场规模、用户画像

```typescript
// src/mastra/agents/market-research-agent.ts
import { crunchbaseTool } from '../tools/crunchbase-tool'

export const marketResearchAgent = new Agent({
  name: 'market-research-agent',
  model: 'google/gemini-2.5-pro',

  instructions: `
You are a market researcher specializing in SaaS/tech markets.

Your expertise:
- Pricing strategy analysis
- Market sizing (TAM/SAM/SOM estimation)
- Customer segmentation
- Competitive positioning maps

Tasks:
1. Analyze pricing tiers of all competitors
2. Identify target audience for each
3. Estimate market share (use public data)
4. Create 2x2 positioning map coordinates

Output format (JSON):
{
  "pricingAnalysis": {...},
  "audienceAnalysis": {...},
  "positioningMap": {
    "competitors": [
      {"name": "Notion", "x": 0.7, "y": 0.6}
    ],
    "axes": {
      "x": "Simplicity ← → Power",
      "y": "Individual ← → Team"
    }
  }
}
`,

  tools: {
    crunchbase: crunchbaseTool,
  },

  maxSteps: 5,
})
```

---

### 4. Strategy Agent

**职责**: SWOT、差异化、GTM 策略

```typescript
// src/mastra/agents/strategy-agent.ts
export const strategyAgent = new Agent({
  name: 'strategy-agent',
  model: 'google/gemini-2.5-pro',

  instructions: `
You are a product strategy consultant with 100+ startup advisory experience.

Your expertise:
- SWOT analysis
- Differentiation strategy
- Go-to-market planning
- Competitive moat identification
- MVP prioritization

Based on:
- Feature comparison matrix
- Market positioning data
- User requirements

Generate:
1. SWOT analysis
2. MVP feature priorities (P0/P1/P2)
3. Differentiation strategy
4. GTM roadmap (Phase 1/2/3)
5. Competitive risks & mitigation

Be direct, actionable, evidence-based.
`,

  tools: {},
  maxSteps: 4,
})
```

---

### 5. Synthesis Agent

**职责**: 整合所有分析,生成最终报告

```typescript
// src/mastra/agents/synthesis-agent.ts
export const synthesisAgent = new Agent({
  name: 'synthesis-agent',
  model: 'google/gemini-2.5-pro',

  instructions: `
You are a business analyst who synthesizes complex data into clear reports.

Input:
- Discovery results (competitors list)
- Feature analyses (all competitors)
- Market research (pricing, positioning)
- Strategy recommendations

Output: Comprehensive competitive analysis report in Markdown format.

Structure:
# Competitive Analysis Report

## Executive Summary
- 3-5 key insights

## Competitors Overview
- Table with all competitors

## Feature Comparison Matrix
- Markdown table

## Market Positioning Analysis
- Pricing insights
- Target audience
- Positioning map description

## SWOT Analysis
- Strengths/Weaknesses/Opportunities/Threats

## Strategic Recommendations
- MVP priorities
- Differentiation strategy
- GTM roadmap
- Risks & mitigation

Use professional tone, data-driven reasoning, clear structure.
`,

  tools: {},
  maxSteps: 2,
})
```

---

## Mastra Configuration

### Main Mastra Instance

```typescript
// src/mastra/index.ts
import { Mastra } from '@mastra/core/mastra'
import { chatRoute } from '@mastra/ai-sdk'

// Import all agents
import { discoveryAgent } from './agents/discovery-agent'
import { featureAnalysisAgent } from './agents/feature-analysis-agent'
import { marketResearchAgent } from './agents/market-research-agent'
import { strategyAgent } from './agents/strategy-agent'
import { synthesisAgent } from './agents/synthesis-agent'

// Import orchestrator workflow
import { competitiveAnalysisWorkflow } from './workflows/competitive-analysis'

export const mastra = new Mastra({
  agents: {
    discoveryAgent,
    featureAnalysisAgent,
    marketResearchAgent,
    strategyAgent,
    synthesisAgent,
  },

  workflows: {
    competitiveAnalysis: competitiveAnalysisWorkflow,
  },

  server: {
    port: 4111,
    apiRoutes: [
      // Expose workflow as API endpoint
      chatRoute({
        path: '/api/mastra/competitive-analysis',
        workflow: 'competitiveAnalysis',
      }),
    ],
  },
})
```

---

## Multi-Agent Orchestration Workflow

### Workflow Definition

```typescript
// src/mastra/workflows/competitive-analysis.ts
import { Workflow } from '@mastra/core/workflow'

export const competitiveAnalysisWorkflow = new Workflow({
  name: 'competitive-analysis',

  // 定义工作流步骤
  steps: {
    // Step 1: Discovery (并行执行 Web Search + Product Hunt)
    discovery: {
      agent: 'discoveryAgent',
      input: ({ productIdea }) => ({
        messages: [{
          role: 'user',
          content: `Find all competitors for: ${productIdea}`
        }]
      }),
    },

    // Step 2: 数据增强(获取竞品详细信息)
    enrichment: {
      dependsOn: ['discovery'],
      agent: null, // 纯数据处理,不需要 Agent
      execute: async ({ discovery }) => {
        const competitors = discovery.output.competitors

        // 并行调用外部 API
        const enriched = await Promise.all(
          competitors.map(async (c) => {
            const [phData, cbData] = await Promise.allSettled([
              fetchProductHunt(c.name),
              fetchCrunchbase(c.name),
            ])

            return {
              ...c,
              logo: phData.value?.logo,
              funding: cbData.value?.funding,
              teamSize: cbData.value?.teamSize,
            }
          })
        )

        return { competitors: enriched }
      },
    },

    // Step 3: 并行分析 - Feature Analysis + Market Research
    parallelAnalysis: {
      dependsOn: ['enrichment'],
      parallel: {
        // 3a. 功能分析(每个竞品)
        featureAnalysis: {
          agent: 'featureAnalysisAgent',
          input: ({ enrichment }) => ({
            competitors: enrichment.output.competitors,
          }),
          // 内部并行处理每个竞品
          forEach: 'competitors',
        },

        // 3b. 市场研究
        marketResearch: {
          agent: 'marketResearchAgent',
          input: ({ enrichment }) => ({
            competitors: enrichment.output.competitors,
          }),
        },
      },
    },

    // Step 4: 战略分析
    strategy: {
      dependsOn: ['parallelAnalysis'],
      agent: 'strategyAgent',
      input: ({ parallelAnalysis }) => ({
        featureMatrix: parallelAnalysis.featureAnalysis.output,
        marketData: parallelAnalysis.marketResearch.output,
      }),
    },

    // Step 5: 综合报告
    synthesis: {
      dependsOn: ['discovery', 'parallelAnalysis', 'strategy'],
      agent: 'synthesisAgent',
      input: (context) => ({
        discovery: context.discovery.output,
        featureAnalysis: context.parallelAnalysis.featureAnalysis.output,
        marketResearch: context.parallelAnalysis.marketResearch.output,
        strategy: context.strategy.output,
      }),
    },
  },

  // 定义输出
  output: ({ synthesis }) => synthesis.output,
})
```

---

## Tool Implementations

### Tavily Search Tool

```typescript
// src/mastra/tools/tavily-tool.ts
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { TavilyClient } from '@tavily/client'

const tavily = new TavilyClient({
  apiKey: process.env.TAVILY_API_KEY!,
})

export const tavilySearchTool = createTool({
  id: 'tavily-search',

  description: `
Search the web for real-time information about products, companies, or competitors.
Use this when you need:
- Current product information (2024+)
- Competitor identification
- Market data
- Recent news or launches
`,

  inputSchema: z.object({
    query: z.string().describe('Search query'),
    maxResults: z.number().optional().default(10),
    searchDepth: z.enum(['basic', 'advanced']).optional().default('advanced'),
  }),

  outputSchema: z.object({
    answer: z.string().describe('AI-generated summary'),
    results: z.array(z.object({
      title: z.string(),
      url: z.string(),
      content: z.string(),
      score: z.number(),
    })),
  }),

  execute: async ({ context }) => {
    const { query, maxResults, searchDepth } = context

    const response = await tavily.search(query, {
      maxResults,
      searchDepth,
      includeAnswer: true,
      includeRawContent: false,
    })

    return {
      answer: response.answer,
      results: response.results.map(r => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
      })),
    }
  },
})
```

---

### Product Hunt Tool

```typescript
// src/mastra/tools/product-hunt-tool.ts
export const productHuntTool = createTool({
  id: 'product-hunt',

  description: 'Fetch product data from Product Hunt including votes, comments, launch date.',

  inputSchema: z.object({
    productName: z.string(),
  }),

  outputSchema: z.object({
    name: z.string(),
    tagline: z.string().optional(),
    description: z.string().optional(),
    website: z.string().optional(),
    logo: z.string().optional(),
    votesCount: z.number().optional(),
    topics: z.array(z.string()).optional(),
  }),

  execute: async ({ context }) => {
    const { productName } = context

    const query = `
      query {
        posts(search: "${productName}") {
          nodes {
            name
            tagline
            description
            website
            thumbnail { url }
            votesCount
            topics { nodes { name } }
          }
        }
      }
    `

    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PRODUCT_HUNT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    const data = await response.json()
    const product = data.data.posts.nodes[0]

    return {
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      website: product.website,
      logo: product.thumbnail?.url,
      votesCount: product.votesCount,
      topics: product.topics.nodes.map(t => t.name),
    }
  },
})
```

---

### Crunchbase Tool

```typescript
// src/mastra/tools/crunchbase-tool.ts
export const crunchbaseTool = createTool({
  id: 'crunchbase',

  description: 'Fetch funding, team size, and company data from Crunchbase.',

  inputSchema: z.object({
    companyName: z.string(),
  }),

  outputSchema: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    foundedYear: z.number().optional(),
    funding: z.string().optional(),
    teamSize: z.string().optional(),
    totalFundingUsd: z.number().optional(),
  }),

  execute: async ({ context }) => {
    const { companyName } = context

    const response = await fetch(
      `https://api.crunchbase.com/api/v4/entities/organizations/${companyName}`,
      {
        headers: {
          'X-cb-user-key': process.env.CRUNCHBASE_API_KEY!,
        },
      }
    )

    const data = await response.json()
    const props = data.properties

    return {
      name: props.name,
      description: props.short_description,
      foundedYear: props.founded_on?.year,
      funding: props.last_funding_type,
      teamSize: props.num_employees_enum,
      totalFundingUsd: props.funding_total?.value_usd,
    }
  },
})
```

---

## API Route Integration

### Next.js API Route (AI SDK Compatible)

```typescript
// app/api/analysis/route.ts
import { mastra } from '@/src/mastra'
import { createUIMessageStream } from 'ai'
import { toAISdkFormat } from '@mastra/ai-sdk'

export async function POST(req: Request) {
  const { productIdea, chatId } = await req.json()

  // 获取 workflow
  const workflow = mastra.getWorkflow('competitiveAnalysis')

  // 执行 workflow,获取流式输出
  const stream = await workflow.stream({
    productIdea,
  })

  // 转换为 AI SDK 兼容格式
  const uiMessageStream = createUIMessageStream({
    execute: async ({ writer }) => {
      for await (const part of toAISdkFormat(stream, { from: 'workflow' })) {
        writer.write(part)
      }
    },
  })

  return uiMessageStream.toDataStreamResponse()
}
```

---

## Frontend Integration (AI SDK React)

```typescript
// app/(app)/analysis/[chatId]/page.tsx
'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

export default function AnalysisPage({ params }: { params: { chatId: string } }) {
  const { messages, sendMessage, status, isLoading } = useChat({
    id: params.chatId,
    transport: new DefaultChatTransport({
      api: '/api/analysis',
    }),
    initialMessages: [], // 从数据库加载
  })

  const startAnalysis = (productIdea: string) => {
    sendMessage({
      text: productIdea,
    })
  }

  return (
    <div>
      {/* 显示分析进度 */}
      {isLoading && <AnalysisProgress messages={messages} />}

      {/* 显示结果 */}
      <AnalysisResults messages={messages} />
    </div>
  )
}
```

---

## Execution Flow

### Complete Analysis Timeline

```
T0: User submits product idea
    ↓
T1: Workflow starts → Discovery Agent
    ├─ Generate 5 search queries (LLM: 5s)
    ├─ Tavily Search × 5 (parallel: 10s)
    └─ Extract competitors (LLM: 8s)
    ✅ Output: 12 competitors identified

T2: Enrichment Step (parallel API calls)
    ├─ Product Hunt × 12 (concurrent: 5s)
    └─ Crunchbase × 12 (concurrent: 5s)
    ✅ Output: Enriched competitor data

T3: Parallel Analysis
    ├─ Feature Analysis Agent × 12 competitors (parallel: 25s)
    │   └─ Each: 10-15 features + strengths/weaknesses
    │
    └─ Market Research Agent (parallel: 30s)
        ├─ Pricing analysis
        ├─ Audience segmentation
        └─ Positioning map generation
    ✅ Output: Feature matrix + Market insights

T4: Strategy Agent (sequential)
    ├─ SWOT analysis (15s)
    ├─ MVP prioritization (10s)
    └─ GTM strategy (12s)
    ✅ Output: Strategic recommendations

T5: Synthesis Agent
    └─ Generate final report (20s)
    ✅ Output: Markdown report (3000+ words)

Total Time: ~2.5 minutes (vs single agent: 8-10 min)
```

---

## Streaming Progress Updates

### Custom Data Parts (AI SDK)

```typescript
// 在 workflow 执行过程中发送自定义进度事件
export const competitiveAnalysisWorkflow = new Workflow({
  // ...

  onStepStart: async ({ step, writer }) => {
    // 发送进度更新到前端
    writer.writeData({
      type: 'progress',
      step: step.name,
      status: 'in_progress',
      message: getStepMessage(step.name),
    })
  },

  onStepFinish: async ({ step, output, writer }) => {
    writer.writeData({
      type: 'progress',
      step: step.name,
      status: 'completed',
      output: summarize(output),
    })
  },
})

function getStepMessage(step: string): string {
  const messages = {
    discovery: '🔍 Searching the web for competitors...',
    enrichment: '📊 Enriching competitor data from Product Hunt & Crunchbase...',
    featureAnalysis: '⚙️ Analyzing features for all competitors...',
    marketResearch: '💰 Analyzing pricing and market positioning...',
    strategy: '🎯 Generating strategic recommendations...',
    synthesis: '📝 Creating final report...',
  }
  return messages[step] || `Processing ${step}...`
}
```

### Frontend Progress Display

```tsx
// components/analysis/analysis-progress.tsx
'use client'

export function AnalysisProgress({ messages }: { messages: Message[] }) {
  // 提取进度事件
  const progressEvents = messages
    .filter(m => m.data?.type === 'progress')
    .map(m => m.data)

  const steps = [
    { id: 'discovery', label: 'Competitor Discovery' },
    { id: 'enrichment', label: 'Data Enrichment' },
    { id: 'featureAnalysis', label: 'Feature Analysis' },
    { id: 'marketResearch', label: 'Market Research' },
    { id: 'strategy', label: 'Strategy Generation' },
    { id: 'synthesis', label: 'Report Synthesis' },
  ]

  return (
    <div className="space-y-4">
      {steps.map((step, i) => {
        const event = progressEvents.find(e => e.step === step.id)
        const status = event?.status || 'pending'

        return (
          <div key={step.id} className="flex items-center gap-3">
            {/* Status icon */}
            {status === 'completed' && <CheckCircle className="text-green-500" />}
            {status === 'in_progress' && <Loader className="animate-spin text-blue-500" />}
            {status === 'pending' && <Circle className="text-gray-300" />}

            {/* Step label */}
            <span className={status === 'in_progress' ? 'font-semibold' : ''}>
              {step.label}
            </span>

            {/* Output preview */}
            {event?.output && (
              <span className="text-sm text-muted-foreground">
                {event.output}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

---

## Performance Optimizations

### 1. Parallel Execution

```typescript
// 功能分析并行处理
const featureAnalyses = await Promise.all(
  competitors.map(competitor =>
    featureAnalysisAgent.generate([{
      role: 'user',
      content: `Analyze features for ${competitor.name}`
    }])
  )
)
```

### 2. Caching Strategy

```typescript
// 缓存竞品基础数据
const cachedCompetitor = await redis.get(`competitor:${name}`)
if (cachedCompetitor && isFresh(cachedCompetitor)) {
  return cachedCompetitor
}

// 否则重新获取并缓存 7 天
const freshData = await enrichCompetitor(name)
await redis.setex(`competitor:${name}`, 7 * 24 * 3600, freshData)
```

### 3. Rate Limiting

```typescript
// 控制外部 API 调用频率
import pLimit from 'p-limit'

const limit = pLimit(3) // 最多同时 3 个请求

const results = await Promise.all(
  competitors.map(c =>
    limit(() => fetchProductHunt(c.name))
  )
)
```

---

## Cost Analysis

### Per Analysis Breakdown

| Component | Provider | Cost |
|-----------|----------|------|
| **Discovery Agent** | Gemini 2.5 Pro | $0.002 |
| Tavily Search (5 queries) | Tavily API | $0.025 |
| Product Hunt (12 calls) | Product Hunt | $0 (free tier) |
| Crunchbase (12 calls) | Crunchbase | $0.06 (cache hit rate 80%) |
| **Feature Analysis Agent** (×12) | Gemini 2.5 Pro | $0.024 |
| **Market Research Agent** | Gemini 2.5 Pro | $0.003 |
| **Strategy Agent** | Gemini 2.5 Pro | $0.003 |
| **Synthesis Agent** | Gemini 2.5 Pro | $0.003 |
| **Total** | | **~$0.12/analysis** |

**vs Single Agent**: $0.03/analysis
**Trade-off**: 4x 成本换取 3-4x 速度 + 更高质量

---

## Deployment

### Environment Variables

```env
# Mastra
MASTRA_PORT=4111

# AI Models
GOOGLE_AI_API_KEY=your_gemini_key

# Tools
TAVILY_API_KEY=your_tavily_key
PRODUCT_HUNT_API_KEY=your_ph_key
CRUNCHBASE_API_KEY=your_cb_key

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MASTRA_PORT=4111
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
      - TAVILY_API_KEY=${TAVILY_API_KEY}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
```

---

## Testing Strategy

### Unit Tests (Agent)

```typescript
// src/mastra/agents/__tests__/discovery-agent.test.ts
import { discoveryAgent } from '../discovery-agent'

describe('Discovery Agent', () => {
  it('should identify competitors from product idea', async () => {
    const response = await discoveryAgent.generate([{
      role: 'user',
      content: 'Find competitors for a note-taking app for developers'
    }])

    const result = JSON.parse(response.text)

    expect(result.competitors).toHaveLength(greaterThan(5))
    expect(result.competitors[0]).toHaveProperty('name')
    expect(result.competitors[0]).toHaveProperty('type')
    expect(result.competitors[0].type).toBeOneOf(['direct', 'indirect', 'adjacent'])
  })
})
```

### Integration Tests (Workflow)

```typescript
// src/mastra/workflows/__tests__/competitive-analysis.test.ts
describe('Competitive Analysis Workflow', () => {
  it('should complete full analysis pipeline', async () => {
    const workflow = mastra.getWorkflow('competitiveAnalysis')

    const result = await workflow.execute({
      productIdea: 'A note-taking app for developers with Git integration'
    })

    expect(result.discovery).toBeDefined()
    expect(result.featureAnalysis).toBeDefined()
    expect(result.strategy).toBeDefined()
    expect(result.report).toContain('# Competitive Analysis Report')
  }, 60000) // 60s timeout
})
```

---

## Migration Guide (Single Agent → Multi-Agent)

### Phase 1: Parallel Development (Week 1-2)

```
Current (Single Agent)     New (Multi-Agent)
         │                        │
         ├──────── Both exist ────┤
         │                        │
    Keep running          Build & test
```

### Phase 2: A/B Testing (Week 3)

```typescript
// Feature flag based routing
const useMultiAgent = await getFeatureFlag(userId, 'multi-agent-analysis')

if (useMultiAgent) {
  // Route to Mastra workflow
  return await mastra.getWorkflow('competitiveAnalysis').execute()
} else {
  // Route to original single agent
  return await legacyAnalysis()
}
```

### Phase 3: Full Migration (Week 4)

- Monitor error rates, response times, user satisfaction
- Gradually increase multi-agent traffic: 10% → 50% → 100%
- Decommission single agent after 100% migration

---

## Monitoring & Observability

### Key Metrics

```typescript
// Track with Vercel Analytics / Posthog
analytics.track('analysis_started', {
  chatId,
  productIdea,
  timestamp: Date.now(),
})

analytics.track('agent_step_completed', {
  step: 'discovery',
  duration: 23000, // ms
  competitors_found: 12,
})

analytics.track('analysis_completed', {
  chatId,
  total_duration: 145000,
  competitors_analyzed: 12,
  report_word_count: 3200,
})
```

### Error Tracking

```typescript
// Sentry integration
Sentry.captureException(error, {
  tags: {
    agent: 'discovery-agent',
    tool: 'tavily-search',
  },
  extra: {
    productIdea,
    query: searchQuery,
  },
})
```

---

## Troubleshooting

### Common Issues

**Issue: Tavily rate limit exceeded**
```typescript
// Solution: Implement exponential backoff
async function tavilySearchWithRetry(query: string, retries = 3) {
  try {
    return await tavily.search(query)
  } catch (error) {
    if (error.code === 'RATE_LIMIT' && retries > 0) {
      await sleep(2 ** (3 - retries) * 1000)
      return tavilySearchWithRetry(query, retries - 1)
    }
    throw error
  }
}
```

**Issue: Agent stuck in loop**
```typescript
// Solution: Set maxSteps limit
export const discoveryAgent = new Agent({
  // ...
  maxSteps: 8, // Prevent infinite loops
})
```

**Issue: Workflow timeout**
```typescript
// Solution: Add timeout handling
const result = await Promise.race([
  workflow.execute({ productIdea }),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Workflow timeout')), 300000) // 5 min
  ),
])
```

---

## Future Enhancements

### 1. Agent Memory

```typescript
// Add conversation memory to agents
export const discoveryAgent = new Agent({
  // ...
  memory: {
    type: 'redis',
    ttl: 3600, // 1 hour
  },
})
```

### 2. Custom Agent Marketplace

Allow users to add custom agents:
- "SaaS Pricing Expert Agent"
- "B2B GTM Specialist Agent"
- "Developer Tools Analyst Agent"

### 3. Real-time Collaboration

Multiple team members analyze competitors together:
- Shared workflow execution
- Live comments on agent outputs
- Role-based access control

---

## Conclusion

This multi-agent architecture provides:
- ✅ **3-4x faster** analysis (2.5 min vs 8-10 min)
- ✅ **Higher quality** insights (specialized agents)
- ✅ **Better scalability** (independent agent upgrades)
- ✅ **Real-time feedback** (streaming progress)
- ✅ **Tool-augmented** intelligence (Tavily + APIs)

**Trade-offs**:
- ⚠️ 4x higher cost per analysis ($0.12 vs $0.03)
- ⚠️ More complex architecture (5 agents + orchestration)
- ⚠️ Longer initial development time (4-6 weeks vs 2-3 weeks)

**Recommendation**: Start with multi-agent architecture given your requirement. The superior user experience and analysis quality justify the additional complexity.

---

**Document Owner:** Engineering Team
**Next Review:** After Phase 1 implementation (Week 6)
**Questions:** engineering@jotlin.com
