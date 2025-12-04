import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

import { generateProductDocumentPrompt } from '@/libs/ai/prompts/product-document-generator'
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
  productDocument: string
  flowchart: string
  sitemap: string
  wireframe: string
}

export class DocumentGenerationService {
  private model = openai('gpt-4o')

  /**
   * Generate Product Document based on requirement content
   * @param requirementContent - The final requirement document content
   * @returns Product Document content
   */
  async generateProductDocument(requirementContent: string): Promise<string> {
    try {
      const prompt = generateProductDocumentPrompt(requirementContent)

      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7,
        maxTokens: 4000,
      })

      const parsed = parseAIResponse(text)

      if (!parsed.productDocument) {
        throw new Error('Failed to extract Product Document content from AI response')
      }

      return parsed.productDocument
    } catch (error) {
      console.error('Error generating Product Document:', error)
      throw new Error(`Product Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate flowchart diagram based on requirement and Product Document
   */
  async generateFlowchart(requirementContent: string, productDocContent: string): Promise<string> {
    try {
      const prompt = generateFlowchartPrompt(requirementContent, productDocContent)

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
   * Generate sitemap diagram based on requirement and Product Document
   */
  async generateSitemap(requirementContent: string, productDocContent: string): Promise<string> {
    try {
      const prompt = generateSitemapPrompt(requirementContent, productDocContent)

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
   * Generate wireframe diagram based on requirement and Product Document
   */
  async generateWireframe(requirementContent: string, productDocContent: string): Promise<string> {
    try {
      const prompt = generateWireframePrompt(requirementContent, productDocContent)

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
   * Generate all documents (Product Document first, then design diagrams in parallel)
   * @param requirementContent - The requirement document content
   * @returns All generated documents
   */
  async generateAllDocuments(requirementContent: string): Promise<GeneratedDocuments> {
    try {
      console.log('[DEBUG] Starting document generation sequence...')

      // Step 1: Generate Product Document (must be first as others depend on it)
      console.log('[DEBUG] Step 1/4: Generating Product Document...')
      const productDocument = await this.generateProductDocument(requirementContent)
      console.log('[DEBUG] Product Document generated, length:', productDocument.length)

      // Step 2-4: Generate design diagrams in parallel (all depend only on requirement + product doc)
      console.log('[DEBUG] Step 2-4: Generating design diagrams in parallel...')
      const [flowchart, sitemap, wireframe] = await Promise.all([
        this.generateFlowchart(requirementContent, productDocument),
        this.generateSitemap(requirementContent, productDocument),
        this.generateWireframe(requirementContent, productDocument),
      ])

      console.log('[DEBUG] All documents generated successfully')
      return {
        productDocument,
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
