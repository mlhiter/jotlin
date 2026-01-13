/**
 * In-memory store for document generation progress
 * This store tracks the progress of auto-document generation tasks
 */

export type GenerationStatus =
  | 'idle'
  | 'generating_product_doc'
  | 'generating_flowchart'
  | 'generating_sitemap'
  | 'generating_wireframe'
  | 'completed'
  | 'error'

export interface GenerationProgress {
  requirementDocId: string
  status: GenerationStatus
  currentStep: string
  totalSteps: number
  completedSteps: number
  generatedDocIds: string[]
  error?: string
  startedAt: Date
  completedAt?: Date
}

class GenerationProgressStore {
  private store = new Map<string, GenerationProgress>()

  /**
   * Start tracking generation progress
   */
  start(requirementDocId: string): void {
    this.store.set(requirementDocId, {
      requirementDocId,
      status: 'idle',
      currentStep: 'Initializing',
      totalSteps: 4,
      completedSteps: 0,
      generatedDocIds: [],
      startedAt: new Date(),
    })
  }

  /**
   * Update generation progress
   */
  update(requirementDocId: string, update: Partial<GenerationProgress>): void {
    const current = this.store.get(requirementDocId)
    if (current) {
      this.store.set(requirementDocId, { ...current, ...update })
    }
  }

  /**
   * Mark generation as completed
   */
  complete(requirementDocId: string, generatedDocIds: string[]): void {
    const current = this.store.get(requirementDocId)
    if (current) {
      this.store.set(requirementDocId, {
        ...current,
        status: 'completed',
        currentStep: 'Completed',
        completedSteps: current.totalSteps,
        generatedDocIds,
        completedAt: new Date(),
      })
    }
  }

  /**
   * Mark generation as failed
   */
  fail(requirementDocId: string, error: string): void {
    const current = this.store.get(requirementDocId)
    if (current) {
      this.store.set(requirementDocId, {
        ...current,
        status: 'error',
        currentStep: 'Failed',
        error,
        completedAt: new Date(),
      })
    }
  }

  /**
   * Get generation progress
   */
  get(requirementDocId: string): GenerationProgress | undefined {
    return this.store.get(requirementDocId)
  }

  /**
   * Clear completed/failed progress (auto-cleanup after 5 minutes)
   */
  cleanup(requirementDocId: string): void {
    const progress = this.store.get(requirementDocId)
    if (progress && (progress.status === 'completed' || progress.status === 'error')) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      if (progress.completedAt && progress.completedAt < fiveMinutesAgo) {
        this.store.delete(requirementDocId)
      }
    }
  }

  /**
   * Auto-cleanup all old entries
   */
  cleanupAll(): void {
    for (const [docId] of this.store) {
      this.cleanup(docId)
    }
  }
}

export const generationProgressStore = new GenerationProgressStore()

// Auto-cleanup every 5 minutes
setInterval(() => {
  generationProgressStore.cleanupAll()
}, 5 * 60 * 1000)
