import { GeneratedDocument } from '@/api/requirements'
import { documentApi } from '@/api/document'

export interface DocumentCreationOptions {
  parentDocumentId?: string | null
  chatId?: string
}

/**
 * Create a document from generated requirement content using markdown
 */
export async function createDocumentFromRequirement(
  doc: GeneratedDocument,
  options: DocumentCreationOptions = {}
): Promise<string> {
  try {
    const result = await documentApi.createFromMarkdown({
      title: doc.title,
      markdownContent: doc.content,
      parentDocument: options.parentDocumentId || null,
      chatId: options.chatId,
    })

    return result.id
  } catch (error) {
    console.error('Failed to create document from requirement:', error)
    throw error
  }
}

/**
 * Create multiple documents from requirement generation results
 */
export async function createDocumentsFromRequirements(
  documents: GeneratedDocument[],
  options: DocumentCreationOptions = {}
): Promise<string[]> {
  const documentIds: string[] = []

  for (const doc of documents) {
    try {
      const documentId = await createDocumentFromRequirement(doc, options)
      documentIds.push(documentId)
    } catch (error) {
      console.error(`Failed to create document for "${doc.title}":`, error)
    }
  }

  return documentIds
}
