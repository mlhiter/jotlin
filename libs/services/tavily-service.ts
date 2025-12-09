import axios from 'axios'

import type { TavilySearchOptions, TavilySearchResponse } from '@/types/competitor'

export class TavilyService {
  private apiClient

  constructor(apiKey?: string) {
    const key = apiKey || process.env.TAVILY_API_KEY || ''
    if (!key) {
      throw new Error('TAVILY_API_KEY is required')
    }

    this.apiClient = axios.create({
      baseURL: 'https://api.tavily.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
    })
  }

  async search(options: TavilySearchOptions): Promise<TavilySearchResponse> {
    const { query, searchDepth = 'basic', maxResults = 5, includeDomains, excludeDomains } = options

    try {
      const { data } = await this.apiClient.post<TavilySearchResponse>('/search', {
        query,
        search_depth: searchDepth,
        max_results: maxResults,
        include_domains: includeDomains,
        exclude_domains: excludeDomains,
        include_answer: false,
        include_raw_content: false,
      })

      return {
        query: data.query,
        results: data.results || [],
        response_time: data.response_time,
      }
    } catch (error) {
      console.error('[TavilyService] Search failed:', error)
      throw error
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.search({ query: 'test', maxResults: 1 })
      return true
    } catch {
      return false
    }
  }
}

let tavilyServiceInstance: TavilyService | null = null

export function getTavilyService(): TavilyService {
  if (!tavilyServiceInstance) {
    tavilyServiceInstance = new TavilyService()
  }
  return tavilyServiceInstance
}
