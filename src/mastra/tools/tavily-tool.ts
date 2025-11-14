import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const tavilySearchTool = createTool({
  id: 'tavily-search',

  description: `
Search the web for real-time information about products, companies, competitors, or market trends.

When to use this tool:
- Finding competitors for a product idea
- Researching product features and capabilities
- Discovering recent product launches (2024+)
- Gathering market intelligence
- Finding user reviews and feedback

This tool returns both an AI-generated summary and raw search results with URLs.
`,

  inputSchema: z.object({
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
    includeImages: z.boolean().optional().default(false).describe('Include images in results'),
  }),

  outputSchema: z.object({
    answer: z.string().describe('AI-generated summary of the search results'),
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        content: z.string().describe('Extracted text content from the page'),
        score: z.number().describe('Relevance score (0-1)'),
        publishedDate: z.string().optional(),
      })
    ),
    query: z.string().describe('Original search query'),
    responseTime: z.number().describe('Time taken to search (ms)'),
  }),

  execute: async ({ context }) => {
    const { query, maxResults, searchDepth, includeImages } = context

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
        includeImages,
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
      }
    } catch (error: any) {
      console.error('[Tavily Tool Error]', error)

      if (error.message?.includes('rate limit')) {
        throw new Error('Tavily API rate limit exceeded. Please wait a moment and try again.')
      }

      if (error.message?.includes('authentication')) {
        throw new Error('Invalid Tavily API key. Please check your environment variables.')
      }

      throw new Error(`Tavily search failed: ${error.message}`)
    }
  },
})
