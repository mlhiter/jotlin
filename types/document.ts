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
