import { parseAIResponse } from '@/libs/ai/xml-parser'
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
 * Extract draft and final content from message parts
 * @param parts - Message parts from Message.parts
 * @returns Extracted draft and final content
 */
export function extractDraftContent(parts: any): {
  draft?: string
  final?: string
} {
  if (!parts || !Array.isArray(parts)) {
    return {}
  }

  let draft: string | undefined
  let final: string | undefined

  for (const part of parts) {
    if (part.type === 'text' && part.text) {
      const parsed = parseAIResponse(part.text)
      if (parsed.draft) {
        draft = parsed.draft
      }
      if (parsed.final) {
        final = parsed.final
      }
    }
  }

  return { draft, final }
}

/**
 * Create version metadata for a message
 * @param content - Draft or final content
 * @param type - 'draft' or 'final'
 * @param phase - Chat phase
 * @returns Metadata object
 */
export function createVersionMetadata(content: string, type: 'draft' | 'final', phase: ChatPhase) {
  return {
    isVersionSnapshot: true,
    versionTitle: extractTitle(content),
    versionType: type,
    phase,
    answered: true,
    answeredAt: new Date().toISOString(),
  }
}

/**
 * Check if a message is a version snapshot
 */
export function isVersionSnapshot(metadata: any): boolean {
  return metadata?.isVersionSnapshot === true
}

/**
 * Get version info from message metadata
 */
export function getVersionInfo(metadata: any): {
  title: string
  type: 'draft' | 'final'
  phase: ChatPhase
} | null {
  if (!isVersionSnapshot(metadata)) {
    return null
  }

  return {
    title: metadata.versionTitle || 'Untitled Version',
    type: metadata.versionType || 'draft',
    phase: metadata.phase,
  }
}
