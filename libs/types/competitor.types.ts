export interface TavilySearchOptions {
  query: string
  searchDepth?: 'basic' | 'advanced'
  maxResults?: number
  includeDomains?: string[]
  excludeDomains?: string[]
}

export interface TavilySearchResultItem {
  title: string
  url: string
  content: string
  score: number
  published_date?: string
}

export interface TavilySearchResponse {
  query: string
  answer?: string
  results: TavilySearchResultItem[]
  response_time?: number
}

export interface KeywordExtractionResult {
  primaryKeywords: string[]
  searchQuery: string
  confidence: number
}

export interface CompetitorResearchRequest {
  chatId: string
  manualQuery?: string
}

export interface CompetitorAnalysis {
  summary: string
  competitors: Array<{
    name: string
    url: string
    description: string
    keyFeatures: string[]
    strengths: string[]
    weaknesses: string[]
    targetAudience: string
    pricing?: string
  }>
  marketInsights: {
    commonFeatures: string[]
    marketGaps: string[]
    trends: string[]
    opportunities: string[]
  }
  recommendations: string[]
}

export interface CompetitorResearchResponse {
  id: string
  chatId: string
  phase: 'REQUIREMENT' | 'ARCHITECTURE' | 'DEVELOPMENT'
  query: string
  results: TavilySearchResponse
  analysis?: CompetitorAnalysis
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
  createdAt: string
  updatedAt: string
}
