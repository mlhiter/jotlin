/**
 * Design Agents (Flowchart, Sitemap, Wireframe)
 * Generates design diagrams based on requirements and product document
 */

import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

import { createDocumentTools } from '../tools/document-tools'
import { createAgentSystemMessage, type DocumentAgentContext } from './document-agent-context'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

type DesignDocumentType = 'FLOWCHART' | 'SITEMAP' | 'WIREFRAME'

interface DesignAgentConfig {
  type: DesignDocumentType
  icon: string
  title: string
  description: string
}

const DESIGN_CONFIGS: Record<DesignDocumentType, DesignAgentConfig> = {
  FLOWCHART: {
    type: 'FLOWCHART',
    icon: '🔄',
    title: 'Flowchart',
    description: 'user flow diagram showing the main user journey and interactions',
  },
  SITEMAP: {
    type: 'SITEMAP',
    icon: '🗺️',
    title: 'Sitemap',
    description: 'site structure diagram showing all pages and their relationships',
  },
  WIREFRAME: {
    type: 'WIREFRAME',
    icon: '📐',
    title: 'Wireframe',
    description: 'wireframe diagram showing the layout of key pages',
  },
}

export class DesignAgent {
  private model = openai('gpt-4o')

  async generate(
    designType: DesignDocumentType,
    context: DocumentAgentContext,
    productDocumentId: string
  ): Promise<string> {
    const config = DESIGN_CONFIGS[designType]
    console.log(`[DesignAgent:${designType}] Starting generation...`)

    // Read documents first (same pattern as ProductDocumentAgent)
    const tools = createDocumentTools(context)

    console.log(`[DesignAgent:${designType}] Reading requirement document...`)
    const requirementDocResult = await tools.get_document.execute({ documentId: context.requirementDocId })

    console.log(`[DesignAgent:${designType}] Reading product document...`)
    const productDocResult = await tools.get_document.execute({ documentId: productDocumentId })

    if (!requirementDocResult.success || !productDocResult.success) {
      throw new Error(`Failed to read documents: ${requirementDocResult.message || productDocResult.message}`)
    }

    const requirementContent = requirementDocResult.document?.content || ''
    const productContent = productDocResult.document?.content || ''

    console.log(`[DesignAgent:${designType}] Documents loaded, requirement: ${requirementContent.length} chars, product: ${productContent.length} chars`)

    const systemMessage = `You are a professional ${config.description} generation agent.

Your task is to:
1. Analyze the requirement and product documents provided below
2. Generate a comprehensive ${config.description} using Mermaid diagram syntax
3. Save your diagram by calling the create_document tool

## Available Tools
- **create_document**: Create a new document (YOU MUST CALL THIS)

## Document Content (Already Loaded)

### Requirement Document
${requirementContent}

### Product Document
${productContent}

## Instructions

Based on the documents above, create a comprehensive ${config.description}:
- Use Mermaid diagram syntax (flowchart, graph, sequenceDiagram, etc.)
- Wrap your Mermaid code in \`\`\`mermaid code blocks
- Include all major components, user flows, and interactions
- Be comprehensive and detailed

After generating your diagram, YOU MUST call create_document with:
- type: "${config.type}"
- title: "${config.title}" (or a descriptive variation)
- content: Your complete diagram in Markdown format
- icon: "${config.icon}"

CRITICAL: Your job is NOT complete until you call create_document!`

    const userMessage = `Generate a ${config.description} for this project based on the requirement and product documents provided in the system message.

Your task:
1. Analyze the documents
2. Create a comprehensive ${config.description} using Mermaid syntax
3. Call create_document to save it (type: "${config.type}", title: "${config.title}", icon: "${config.icon}")

Start now and remember: YOU MUST call create_document to complete the task!`

    try {
      const result = await generateText({
        model: this.model,
        system: systemMessage,
        prompt: userMessage,
        tools: {
          create_document: tools.create_document,
        },
        maxSteps: 5, // Only need 1 step (create_document), but allow retries
        temperature: 0.7,
      })

      console.log(`[DesignAgent:${designType}] Generation completed`)
      console.log(`[DesignAgent:${designType}] Steps taken:`, result.steps.length)
      console.log(`[DesignAgent:${designType}] Response:`, result.text)

      // Extract document ID from tool results
      let documentId: string | undefined

      // Check result.toolResults for create_document
      if (result.toolResults) {
        const createDocResult = result.toolResults.find((tr) => tr.toolName === 'create_document')
        if (createDocResult?.output?.documentId) {
          documentId = createDocResult.output.documentId
          console.log(`[DesignAgent:${designType}] Found documentId:`, documentId)
        }
      }

      if (!documentId) {
        console.error(`[DesignAgent:${designType}] Failed to extract documentId from result`)
        throw new Error(`Agent did not create a ${config.type} document`)
      }

      console.log(`[DesignAgent:${designType}] Created document ID:`, documentId)
      return documentId
    } catch (error) {
      console.error(`[DesignAgent:${designType}] Generation failed:`, error)
      throw error
    }
  }
}

export const designAgent = new DesignAgent()
