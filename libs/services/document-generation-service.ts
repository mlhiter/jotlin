import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

import {
  generateFlowchartPrompt,
  generateSitemapPrompt,
  generateWireframePrompt,
} from '@/libs/ai/prompts/design-generator'
import { generateProductDocumentPrompt } from '@/libs/ai/prompts/product-document-generator'
import { parseAIResponse } from '@/libs/ai/xml-parser'

import type { GeneratedDocuments } from '@/types/document'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

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

      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7,
        maxTokens: 2000,
      })

      const parsed = parseAIResponse(text)

      if (!parsed.flowchart) {
        throw new Error('Failed to extract flowchart from AI response')
      }

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

      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7,
      })

      const parsed = parseAIResponse(text)

      if (!parsed.sitemap) {
        throw new Error('Failed to extract sitemap from AI response')
      }

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

      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7,
      })

      const parsed = parseAIResponse(text)

      if (!parsed.wireframe) {
        throw new Error('Failed to extract wireframe from AI response')
      }

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
      const productDocument = await this.generateProductDocument(requirementContent)

      const [flowchart, sitemap, wireframe] = await Promise.all([
        this.generateFlowchart(requirementContent, productDocument),
        this.generateSitemap(requirementContent, productDocument),
        this.generateWireframe(requirementContent, productDocument),
      ])

      return {
        productDocument,
        flowchart,
        sitemap,
        wireframe,
      }
    } catch (error) {
      console.error('[ERROR] Document generation failed:', error)
      throw new Error(`Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Singleton instance
export const documentGenerationService = new DocumentGenerationService()
