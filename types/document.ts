export interface GeneratedDocuments {
  productDocument: string
  flowchart: string
  sitemap: string
  wireframe: string
}

export interface Document {
  id: string
  projectId: string | null
  workspaceId: string
  title: string
  documentType: string
  icon: string | null
  isAIGenerated: boolean
  lastEditedAt: string
}

export interface DocumentToolContext {
  chatThreadId: string
  projectId: string | null
  workspaceId: string
  userId: string
  messageId: string
}

export const documentTypes = ['REQUIREMENT', 'PRODUCT_DOCUMENT', 'FLOWCHART', 'SITEMAP', 'WIREFRAME', 'CUSTOM'] as const
