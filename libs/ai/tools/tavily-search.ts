import { tool } from 'ai'
import { z } from 'zod'

export const tavilySearchTool = tool({
  description: `Search the web for real-time information about products, companies, competitors, or market trends.

When to use this tool:
- Finding competitors for a product idea
- Researching product features and capabilities
- Discovering recent product launches (2024+)
- Gathering market intelligence
- Finding user reviews and feedback

This tool returns both an AI-generated summary and raw search results with URLs.`,

  parameters: z.object({
    query: z
      .string()
      .describe(
        'The search query. Be specific and use keywords like "alternatives", "competitors", "vs"'
      ),
    maxResults: z
      .number()
      .optional()
      .default(10)
      .describe('Maximum number of results to return (1-10)'),
    searchDepth: z
      .enum(['basic', 'advanced'])
      .optional()
      .default('advanced')
      .describe('Search depth: basic (faster) or advanced (more comprehensive)'),
  }),

  execute: async ({ query, maxResults = 10, searchDepth = 'advanced' }) => {
    const startTime = Date.now()

    try {
      const { tavily } = await import('@tavily/core')

      const client = tavily({
        apiKey: process.env.TAVILY_API_KEY,
      })

      const response = await client.search(query, {
        maxResults,
        searchDepth,
        includeAnswer: true,
        includeRawContent: false,
      })

      const responseTime = Date.now() - startTime

      return {
        answer: response.answer || '',
        results: response.results.map((r: any) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
          publishedDate: r.published_date,
        })),
        query,
        responseTime,
        totalResults: response.results.length,
      }
    } catch (error: any) {
      console.error('[Tavily Tool Error]', error)

      if (error.message?.includes('rate limit')) {
        return {
          error: 'Tavily API rate limit exceeded. Please wait a moment and try again.',
          query,
          results: [],
          answer: '',
          responseTime: Date.now() - startTime,
        }
      }

      if (error.message?.includes('authentication')) {
        return {
          error: 'Invalid Tavily API key. Please check your environment variables.',
          query,
          results: [],
          answer: '',
          responseTime: Date.now() - startTime,
        }
      }

      return {
        error: `Tavily search failed: ${error.message}`,
        query,
        results: [],
        answer: '',
        responseTime: Date.now() - startTime,
      }
    }
  },
})
