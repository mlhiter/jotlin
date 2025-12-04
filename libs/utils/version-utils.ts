import { parseAIResponse } from '@/libs/ai/xml-parser'
import { DocumentType } from '@/schema/chat'
import { ChatPhase } from '@prisma/client'

/**
 * Extract the first heading from markdown content as version title
 * @param markdown - Markdown content
 * @returns Extracted title or default title with timestamp
 */
export function extractTitle(markdown: string): string {
  if (!markdown) {
    return `Version ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })}`
  }

  // Extract first # heading
  const match = markdown.match(/^#\s+(.+)$/m)
  if (match && match[1]) {
    return match[1].trim()
  }

  // If no heading found, use first non-empty line (max 50 chars)
  const firstLine = markdown
    .split('\n')
    .find((line) => line.trim().length > 0)
    ?.trim()

  if (firstLine) {
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
  }

  // Fallback to timestamp
  return `Version ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })}`
}

/**
 * Extract all document content from message parts
 * @param parts - Message parts from Message.parts
 * @returns Extracted document content for all types
 */
export function extractDocumentContent(parts: any): {
  draft?: string
  final?: string
  productDocument?: string
  flowchart?: string
  sitemap?: string
  wireframe?: string
} {
  if (!parts || !Array.isArray(parts)) {
    return {}
  }

  let draft: string | undefined
  let final: string | undefined
  let productDocument: string | undefined
  let flowchart: string | undefined
  let sitemap: string | undefined
  let wireframe: string | undefined

  for (const part of parts) {
    if (part.type === 'text' && part.text) {
      const parsed = parseAIResponse(part.text)
      if (parsed.draft) draft = parsed.draft
      if (parsed.final) final = parsed.final
      if (parsed.productDocument) productDocument = parsed.productDocument
      if (parsed.flowchart) flowchart = parsed.flowchart
      if (parsed.sitemap) sitemap = parsed.sitemap
      if (parsed.wireframe) wireframe = parsed.wireframe
    }
  }

  return { draft, final, productDocument, flowchart, sitemap, wireframe }
}

/**
 * Backward compatibility: Extract draft and final content only
 */
export function extractDraftContent(parts: any): {
  draft?: string
  final?: string
} {
  const { draft, final } = extractDocumentContent(parts)
  return { draft, final }
}

/**
 * Create version metadata for a message with document type support
 * @param content - Document content
 * @param type - 'draft' or 'final'
 * @param phase - Chat phase
 * @param documentType - Document type (optional)
 * @param versionGroupId - Version group ID for multi-document versioning (optional)
 * @param generatedFrom - Source message ID for generated documents (optional)
 * @returns Metadata object
 */
export function createVersionMetadata(
  content: string,
  type: 'draft' | 'final',
  phase: ChatPhase,
  documentType?: DocumentType,
  versionGroupId?: string,
  generatedFrom?: string
) {
  return {
    isVersionSnapshot: true,
    versionTitle: extractTitle(content),
    versionType: type,
    phase,
    documentType,
    versionGroupId,
    generatedFrom,
    answered: true,
    answeredAt: new Date().toISOString(),
  }
}

/**
 * Create a unique version group ID for a batch of generated documents
 */
export function createVersionGroupId(): string {
  return crypto.randomUUID()
}

/**
 * Extract document title based on document type
 * @param content - Document content
 * @param documentType - Document type
 * @returns Title string
 */
export function extractDocumentTitle(content: string, documentType: DocumentType): string {
  const defaultTitles: Record<DocumentType, string> = {
    REQUIREMENT: 'Requirement Document',
    PRODUCT_DOCUMENT: 'Product Document',
    FLOWCHART: 'Business Flowchart',
    SITEMAP: 'Site Structure Map',
    WIREFRAME: 'UI Wireframe',
  }

  // For Requirement and Product Document, try to extract from content
  if (documentType === 'REQUIREMENT' || documentType === 'PRODUCT_DOCUMENT') {
    return extractTitle(content)
  }

  // For diagrams, use default title
  return defaultTitles[documentType] || 'Document'
}

/**
 * Check if a message is a version snapshot
 */
export function isVersionSnapshot(metadata: any): boolean {
  return metadata?.isVersionSnapshot === true
}

/**
 * Get version info from message metadata with document type support
 */
export function getVersionInfo(metadata: any): {
  title: string
  type: 'draft' | 'final'
  phase: ChatPhase
  documentType?: DocumentType
  versionGroupId?: string
  generatedFrom?: string
} | null {
  if (!isVersionSnapshot(metadata)) {
    return null
  }

  return {
    title: metadata.versionTitle || 'Untitled Version',
    type: metadata.versionType || 'draft',
    phase: metadata.phase,
    documentType: metadata.documentType,
    versionGroupId: metadata.versionGroupId,
    generatedFrom: metadata.generatedFrom,
  }
}
