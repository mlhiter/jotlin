import { designAgent } from '@/libs/ai/agents/design-agent'
import { productDocumentAgent } from '@/libs/ai/agents/product-document-agent'
import { prisma } from '@/libs/utils/prisma'

import { generationProgressStore } from './generation-progress-store'

import type { DocumentAgentContext } from '@/libs/ai/agents/document-agent-context'

export class AutoDocumentGenerationService {
  /**
   * Auto-generate related documents using AI agents
   * @param requirementDocId - ID of the requirement document
   * @returns Array of created document IDs
   */
  async generateRelatedDocuments(requirementDocId: string): Promise<string[]> {
    try {
      // Initialize progress tracking
      generationProgressStore.start(requirementDocId)

      const requirementDoc = await prisma.document.findFirst({
        where: {
          id: requirementDocId,
          documentType: 'REQUIREMENT',
          isDeleted: false,
        },
        include: {
          project: true,
          workspace: true,
        },
      })

      if (!requirementDoc) {
        console.error('[AutoGen] Requirement document not found:', requirementDocId)
        generationProgressStore.fail(requirementDocId, 'Requirement document not found')
        return []
      }

      if (!requirementDoc.content) {
        console.error('[AutoGen] Requirement document has no content:', requirementDocId)
        generationProgressStore.fail(requirementDocId, 'Requirement document has no content')
        return []
      }

      console.log('[AutoGen] Starting agent-based document generation for:', requirementDoc.title)

      // Create agent context
      const agentContext: DocumentAgentContext = {
        chatThreadId: '', // Not needed for auto-generation
        projectId: requirementDoc.projectId || undefined,
        workspaceId: requirementDoc.workspaceId,
        userId: requirementDoc.workspace.userId,
        messageId: 'auto-generation',
        requirementDocId,
        requirementContent: requirementDoc.content,
      }

      const createdDocIds: string[] = []

      // Step 1: Generate Product Document using Agent
      generationProgressStore.update(requirementDocId, {
        status: 'generating_product_doc',
        currentStep: 'Product Document Agent is working...',
        completedSteps: 0,
      })

      console.log('[AutoGen] Step 1/4: Generating Product Document with agent...')
      let productDocId: string
      try {
        productDocId = await productDocumentAgent.generate(agentContext)
        createdDocIds.push(productDocId)
        console.log('[AutoGen] ✅ Product Document created:', productDocId)
      } catch (error) {
        console.error('[AutoGen] ❌ Step 1/4 failed - Product Document generation error:', error)
        throw error
      }

      // Step 2: Generate Flowchart using Agent
      generationProgressStore.update(requirementDocId, {
        status: 'generating_flowchart',
        currentStep: 'Flowchart Agent is working...',
        completedSteps: 1,
      })

      console.log('[AutoGen] Step 2/4: Generating Flowchart with agent...')
      const flowchartDocId = await designAgent.generate('FLOWCHART', agentContext, productDocId)
      createdDocIds.push(flowchartDocId)
      console.log('[AutoGen] Flowchart created:', flowchartDocId)

      // Step 3: Generate Sitemap using Agent
      generationProgressStore.update(requirementDocId, {
        status: 'generating_sitemap',
        currentStep: 'Sitemap Agent is working...',
        completedSteps: 2,
      })

      console.log('[AutoGen] Step 3/4: Generating Sitemap with agent...')
      const sitemapDocId = await designAgent.generate('SITEMAP', agentContext, productDocId)
      createdDocIds.push(sitemapDocId)
      console.log('[AutoGen] Sitemap created:', sitemapDocId)

      // Step 4: Generate Wireframe using Agent
      generationProgressStore.update(requirementDocId, {
        status: 'generating_wireframe',
        currentStep: 'Wireframe Agent is working...',
        completedSteps: 3,
      })

      console.log('[AutoGen] Step 4/4: Generating Wireframe with agent...')
      const wireframeDocId = await designAgent.generate('WIREFRAME', agentContext, productDocId)
      createdDocIds.push(wireframeDocId)
      console.log('[AutoGen] Wireframe created:', wireframeDocId)

      console.log('[AutoGen] ✅ Completed! Generated', createdDocIds.length, 'documents using agents')

      // Mark as completed
      generationProgressStore.complete(requirementDocId, createdDocIds)

      return createdDocIds
    } catch (error) {
      console.error('[AutoGen] ❌ Failed to generate related documents:', error)
      generationProgressStore.fail(
        requirementDocId,
        error instanceof Error ? error.message : 'Unknown error occurred'
      )
      return []
    }
  }

  /**
   * Trigger auto-generation in background (non-blocking)
   * @param requirementDocId - ID of the requirement document
   */
  async triggerAutoGeneration(requirementDocId: string): Promise<void> {
    console.log('[AutoGen] 🚀 triggerAutoGeneration called with ID:', requirementDocId)
    // Execute in background without waiting
    this.generateRelatedDocuments(requirementDocId).catch((error) => {
      console.error('[AutoGen] ❌ Background generation failed:', error)
    })
    console.log('[AutoGen] ✅ Background generation started (non-blocking)')
  }
}

export const autoDocumentGenerationService = new AutoDocumentGenerationService()
