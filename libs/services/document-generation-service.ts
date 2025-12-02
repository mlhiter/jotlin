import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

import { generatePRDPrompt } from '@/libs/ai/prompts/prd-generator'
import {
  generateFlowchartPrompt,
  generateSitemapPrompt,
  generateWireframePrompt,
} from '@/libs/ai/prompts/design-generator'
import { parseAIResponse } from '@/libs/ai/xml-parser'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GeneratedDocuments {
  prd: string
  flowchart: string
  sitemap: string
  wireframe: string
}

export class DocumentGenerationService {
  private model = openai('gpt-4o')

  /**
   * Generate PRD document based on requirement content
   * @param requirementContent - The final requirement document content
   * @returns PRD document content
   */
  async generatePRD(requirementContent: string): Promise<string> {
    try {
      const prompt = generatePRDPrompt(requirementContent)

      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7,
        maxTokens: 4000,
      })

      const parsed = parseAIResponse(text)

      if (!parsed.prd) {
        throw new Error('Failed to extract PRD content from AI response')
      }

      return parsed.prd
    } catch (error) {
      console.error('Error generating PRD:', error)
      throw new Error(`PRD generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate flowchart diagram based on requirement and PRD
   */
  async generateFlowchart(requirementContent: string, prdContent: string): Promise<string> {
    try {
      const prompt = generateFlowchartPrompt(requirementContent, prdContent)

      console.log('[DEBUG] Generating flowchart...')
      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7,
        maxTokens: 2000,
      })

      console.log('[DEBUG] Flowchart AI response length:', text.length)
      const parsed = parseAIResponse(text)

      if (!parsed.flowchart) {
        throw new Error('Failed to extract flowchart from AI response')
      }

      console.log('[DEBUG] Parsed flowchart length:', parsed.flowchart.length)
      return parsed.flowchart
    } catch (error) {
      console.error('Error generating flowchart:', error)
      throw new Error(`Flowchart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate sitemap diagram based on requirement and PRD
   */
  async generateSitemap(requirementContent: string, prdContent: string): Promise<string> {
    try {
      const prompt = generateSitemapPrompt(requirementContent, prdContent)

      console.log('[DEBUG] Generating sitemap...')
      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7,
        maxTokens: 2000,
      })

      console.log('[DEBUG] Sitemap AI response length:', text.length)
      const parsed = parseAIResponse(text)

      if (!parsed.sitemap) {
        throw new Error('Failed to extract sitemap from AI response')
      }

      console.log('[DEBUG] Parsed sitemap length:', parsed.sitemap.length)
      return parsed.sitemap
    } catch (error) {
      console.error('Error generating sitemap:', error)
      throw new Error(`Sitemap generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate wireframe diagram based on requirement and PRD
   */
  async generateWireframe(requirementContent: string, prdContent: string): Promise<string> {
    try {
      const prompt = generateWireframePrompt(requirementContent, prdContent)

      console.log('[DEBUG] Generating wireframe...')
      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7,
        maxTokens: 2000,
      })

      console.log('[DEBUG] Wireframe AI response length:', text.length)
      const parsed = parseAIResponse(text)

      if (!parsed.wireframe) {
        throw new Error('Failed to extract wireframe from AI response')
      }

      console.log('[DEBUG] Parsed wireframe length:', parsed.wireframe.length)
      return parsed.wireframe
    } catch (error) {
      console.error('Error generating wireframe:', error)
      throw new Error(`Wireframe generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate all documents (PRD + design diagrams) in sequence
   * @param requirementContent - The requirement document content
   * @returns All generated documents
   */
  async generateAllDocuments(requirementContent: string): Promise<GeneratedDocuments> {
    try {
      console.log('[DEBUG] Starting document generation sequence...')

      // Round 1: Generate PRD
      console.log('[DEBUG] Step 1/4: Generating PRD...')
      const prd = await this.generatePRD(requirementContent)
      console.log('[DEBUG] PRD generated, length:', prd.length)

      // Round 2: Generate flowchart
      console.log('[DEBUG] Step 2/4: Generating flowchart...')
      const flowchart = await this.generateFlowchart(requirementContent, prd)

      // Round 3: Generate sitemap
      console.log('[DEBUG] Step 3/4: Generating sitemap...')
      const sitemap = await this.generateSitemap(requirementContent, prd)

      // Round 4: Generate wireframe
      console.log('[DEBUG] Step 4/4: Generating wireframe...')
      const wireframe = await this.generateWireframe(requirementContent, prd)

      console.log('[DEBUG] All documents generated successfully')
      return {
        prd,
        flowchart,
        sitemap,
        wireframe,
      }
    } catch (error) {
      console.error('[ERROR] Document generation failed:', error)
      throw new Error(
        `Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

// Singleton instance
export const documentGenerationService = new DocumentGenerationService()
