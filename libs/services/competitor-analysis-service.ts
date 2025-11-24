import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

import type { TavilySearchResponse, CompetitorAnalysis } from '@/libs/types/competitor.types'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

const ANALYSIS_PROMPT = `You are a professional product analyst specializing in competitive analysis.

Your task: Analyze the search results about competitors and provide structured, high-quality insights.

CRITICAL REQUIREMENTS:
1. ALL output MUST be in English only
2. Focus on real, identifiable competitors with actual websites
3. Provide deep, specific insights based on the search results
4. Avoid generic or vague statements
5. Prioritize quality over quantity - better to have 3 great competitors than 5 mediocre ones

Input: Search results containing information about similar products/services
Output: A JSON object with the following structure:

{
  "summary": "2-3 sentence overview of the competitive landscape with specific market details",
  "competitors": [
    {
      "name": "Product/Company name",
      "url": "Website URL",
      "description": "Specific, detailed description of what makes this product unique",
      "keyFeatures": ["Specific feature with details", "Another concrete feature", "..."],
      "strengths": ["Specific competitive advantage", "Concrete strength", "..."],
      "weaknesses": ["Specific limitation or gap", "Concrete weakness", "..."],
      "targetAudience": "Specific target user segment with details",
      "pricing": "Actual pricing model with specifics if available"
    }
  ],
  "marketInsights": {
    "commonFeatures": ["Specific standard features that all/most competitors offer"],
    "marketGaps": ["Specific unmet needs you identified from analyzing competitors"],
    "trends": ["Specific market trends with evidence from search results"],
    "opportunities": ["Concrete differentiation opportunities with reasoning"]
  },
  "recommendations": ["Specific, actionable recommendations with clear reasoning"]
}

Quality Guidelines:
1. Extract 3-5 main competitors (prefer quality over quantity)
2. Only include competitors you can verify from search results
3. Be specific: Instead of "good UI", say "modern, minimalist interface with drag-and-drop"
4. Include concrete details: pricing, user counts, key differentiators
5. For each insight, ask yourself: "Is this specific and actionable?"
6. If information is truly unavailable, say "Not specified in sources"
7. Return ONLY valid JSON, no markdown code blocks or additional text

Search Results:
`

export class CompetitorAnalysisService {
  async analyzeCompetitors(searchResults: TavilySearchResponse): Promise<CompetitorAnalysis> {
    try {
      const resultsText = searchResults.results
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(
          (r, idx) => `
[Source ${idx + 1}] (Relevance: ${(r.score * 100).toFixed(0)}%)
Title: ${r.title}
URL: ${r.url}
Content: ${r.content}
${r.published_date ? `Published: ${r.published_date}` : ''}
---
`
        )
        .join('\n')

      if (searchResults.results.length === 0) {
        return this.getFallbackAnalysis()
      }

      const { text } = await generateText({
        model: openai.chat('gemini-2.5-pro'),
        prompt: ANALYSIS_PROMPT + resultsText,
        temperature: 0.3,
      })

      const cleanedText = text
        .trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
      const analysis = JSON.parse(cleanedText) as CompetitorAnalysis

      return this.validateAndNormalizeAnalysis(analysis)
    } catch (error) {
      console.error('[CompetitorAnalysisService] Analysis failed:', error)
      return this.getFallbackAnalysis(searchResults)
    }
  }

  private validateAndNormalizeAnalysis(analysis: unknown): CompetitorAnalysis {
    const data = analysis as Record<string, unknown>
    const marketInsights = data.marketInsights as Record<string, unknown> | undefined

    return {
      summary: (data.summary as string) || 'No analysis available',
      competitors: Array.isArray(data.competitors)
        ? data.competitors.map((c: unknown) => {
            const competitor = c as Record<string, unknown>
            return {
              name: (competitor.name as string) || 'Unknown',
              url: (competitor.url as string) || '',
              description: (competitor.description as string) || '',
              keyFeatures: Array.isArray(competitor.keyFeatures) ? (competitor.keyFeatures as string[]) : [],
              strengths: Array.isArray(competitor.strengths) ? (competitor.strengths as string[]) : [],
              weaknesses: Array.isArray(competitor.weaknesses) ? (competitor.weaknesses as string[]) : [],
              targetAudience: (competitor.targetAudience as string) || 'Not specified',
              pricing: competitor.pricing as string | undefined,
            }
          })
        : [],
      marketInsights: {
        commonFeatures: Array.isArray(marketInsights?.commonFeatures)
          ? (marketInsights.commonFeatures as string[])
          : [],
        marketGaps: Array.isArray(marketInsights?.marketGaps) ? (marketInsights.marketGaps as string[]) : [],
        trends: Array.isArray(marketInsights?.trends) ? (marketInsights.trends as string[]) : [],
        opportunities: Array.isArray(marketInsights?.opportunities) ? (marketInsights.opportunities as string[]) : [],
      },
      recommendations: Array.isArray(data.recommendations) ? (data.recommendations as string[]) : [],
    }
  }

  private getFallbackAnalysis(searchResults?: TavilySearchResponse): CompetitorAnalysis {
    const competitors =
      searchResults?.results.slice(0, 3).map((r) => ({
        name: r.title.split('-')[0].trim() || r.title.substring(0, 50),
        url: r.url,
        description: r.content.substring(0, 200),
        keyFeatures: [],
        strengths: [],
        weaknesses: [],
        targetAudience: 'Not analyzed',
        pricing: undefined,
      })) || []

    return {
      summary: 'Automated analysis is currently unavailable. Please review the raw search results.',
      competitors,
      marketInsights: {
        commonFeatures: [],
        marketGaps: [],
        trends: [],
        opportunities: [],
      },
      recommendations: ['Manual review of search results recommended'],
    }
  }
}
