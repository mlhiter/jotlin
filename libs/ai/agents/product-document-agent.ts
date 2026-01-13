/**
 * Product Document Agent
 * Generates comprehensive product documentation from requirements
 */

import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

import { createDocumentTools } from '../tools/document-tools'
import { createAgentSystemMessage, createAgentUserMessage, type DocumentAgentContext } from './document-agent-context'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

export class ProductDocumentAgent {
  private model = openai('gpt-4o')

  async generate(context: DocumentAgentContext): Promise<string> {
    console.log('[ProductDocumentAgent] Starting generation...')

    const tools = createDocumentTools(context)
    const systemMessage = createAgentSystemMessage('Product Document', context)
    const userMessage = createAgentUserMessage('PRODUCT_DOCUMENT', context.requirementContent)

    try {
      const result = await generateText({
        model: this.model,
        system: systemMessage,
        prompt: userMessage,
        tools: {
          create_document: tools.create_document,
          get_document: tools.get_document,
          update_document: tools.update_document,
          list_documents: tools.list_documents,
        },
        maxSteps: 5, // Allow multiple tool calls
        temperature: 0.7,
      })

      console.log('[ProductDocumentAgent] Generation completed')
      console.log('[ProductDocumentAgent] Steps taken:', result.steps.length)
      console.log('[ProductDocumentAgent] Response:', result.text)
      console.log('[ProductDocumentAgent] Tool results count:', result.toolResults?.length || 0)

      // Extract document ID from tool results
      // Try multiple approaches to find the document ID
      let documentId: string | undefined

      // Approach 1: Check result.toolResults (output field)
      if (result.toolResults) {
        const createDocResult = result.toolResults.find((tr) => tr.toolName === 'create_document')
        if (createDocResult?.output?.documentId) {
          documentId = createDocResult.output.documentId
          console.log('[ProductDocumentAgent] Found documentId in result.toolResults.output:', documentId)
        }
      }

      // Approach 2: Check result.steps
      if (!documentId && result.steps) {
        for (const step of result.steps) {
          if (step.toolResults) {
            const createDocResult = step.toolResults.find((tr: any) => tr.toolName === 'create_document')
            if (createDocResult?.output?.documentId) {
              documentId = createDocResult.output.documentId
              console.log('[ProductDocumentAgent] Found documentId in step.toolResults.output:', documentId)
              break
            }
          }
        }
      }

      if (!documentId) {
        console.error('[ProductDocumentAgent] Failed to extract documentId from result')
        console.error('[ProductDocumentAgent] Available tool results:', result.toolResults)
        throw new Error('Agent did not create a document')
      }

      console.log('[ProductDocumentAgent] Created document ID:', documentId)
      return documentId
    } catch (error) {
      console.error('[ProductDocumentAgent] Generation failed:', error)
      throw error
    }
  }
}

export const productDocumentAgent = new ProductDocumentAgent()
