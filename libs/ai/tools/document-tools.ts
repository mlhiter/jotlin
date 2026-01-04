import { tool } from 'ai'
import { z } from 'zod'

import { prisma } from '@/libs/utils/prisma'

import type { DocumentToolContext } from './types'

/**
 * Create a new document in the project
 *
 * Use this tool when:
 * - User explicitly requests to save or create a document
 * - You have complete, well-structured content ready to persist
 * - After finalizing requirements in conversation
 *
 * Best practices:
 * - Use descriptive titles
 * - Choose appropriate document type
 * - Include complete Markdown content
 * - Check for duplicates first with list_documents
 */
export function createDocumentTools(context: DocumentToolContext) {
  const createDocument = tool({
    description: 'Create a new document in the project with version tracking',
    inputSchema: z.object({
      title: z.string().describe('Document title (e.g., "E-commerce Platform Requirements")'),
      type: z.string().describe('Document type (e.g., "REQUIREMENT", "PRODUCT_DOCUMENT", "CUSTOM")'),
      content: z.string().describe('Complete document content in Markdown format'),
      icon: z.string().optional().describe('Document icon emoji (default: 📄)'),
      description: z.string().optional().describe('Optional document description'),
    }),
    execute: async (args) => {
      try {
        const { chatThreadId, projectId, workspaceId, userId, messageId } = context
        const { title, type, content, icon, description } = args

      if (!projectId) {
        return {
          success: false,
          message: 'Cannot create document: No project associated with this chat thread',
        }
      }

      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          userId,
          isDeleted: false,
        },
      })

      if (!workspace) {
        return {
          success: false,
          message: 'Workspace not found or access denied',
        }
      }

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          workspaceId,
          isDeleted: false,
        },
      })

      if (!project) {
        return {
          success: false,
          message: 'Project not found',
        }
      }

      // Check if there's an existing AI-generated document of the same type
      const existingDocument = await prisma.document.findFirst({
        where: {
          projectId,
          workspaceId,
          documentType: type,
          isAIGenerated: true,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existingDocument) {
        // Update existing document instead of creating a new one
        const newVersion = existingDocument.currentVersion + 1

        const updatedDocument = await prisma.document.update({
          where: { id: existingDocument.id },
          data: {
            title,
            icon: icon || existingDocument.icon,
            content,
            currentVersion: newVersion,
            lastEditedAt: new Date(),
            generationPrompt: existingDocument.generationPrompt
              ? `${existingDocument.generationPrompt}\n\nVersion ${newVersion}: ${description || 'Updated via AI tool'}`
              : `Version ${newVersion}: ${description || 'Updated via AI tool'}`,
          },
        })

        const version = await prisma.documentVersion.create({
          data: {
            documentId: existingDocument.id,
            content,
            versionNumber: newVersion,
            createdBy: messageId,
          },
        })

        return {
          success: true,
          documentId: updatedDocument.id,
          versionId: version.id,
          title: updatedDocument.title,
          type: updatedDocument.documentType,
          message: `Document "${title}" updated to version ${newVersion} (existing ${type} document found)`,
        }
      }

      // No existing document, create new one
      const maxOrder = await prisma.document.findFirst({
        where: {
          projectId,
          workspaceId,
          isDeleted: false,
        },
        orderBy: { order: 'desc' },
        select: { order: true },
      })

      const document = await prisma.document.create({
        data: {
          workspaceId,
          projectId,
          title,
          icon: icon || '📄',
          documentType: type,
          content,
          order: (maxOrder?.order ?? -1) + 1,
          isAIGenerated: true,
          sourceMessageId: messageId,
          generationPrompt: description || `Created via AI tool from chat thread ${chatThreadId}`,
          currentVersion: 1,
        },
      })

      const version = await prisma.documentVersion.create({
        data: {
          documentId: document.id,
          content,
          versionNumber: 1,
          createdBy: messageId,
        },
      })

      await prisma.chatThread.create({
        data: {
          documentId: document.id,
          type: 'DOCUMENT',
          title: 'Document Chat',
        },
      })

      return {
        success: true,
        documentId: document.id,
        versionId: version.id,
        title: document.title,
        type: document.documentType,
        message: `Document "${title}" created successfully with version 1`,
      }
    } catch (error) {
      console.error('create_document error:', error)
      return {
        success: false,
        message: `Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
    },
  })

  /**
   * Get a document's current content and metadata
 *
 * Use this tool when:
 * - You need to read a document's current content before updating it
 * - User asks to view or reference a specific document
 * - You need to check document details before making changes
 *
 * Best practices:
 * - Always get_document before update_document to know current content
 * - Verify document exists before referencing it in conversation
 */
  const getDocument = tool({
    description: "Retrieve a document's current content and metadata",
    inputSchema: z.object({
      documentId: z.string().describe('The ID of the document to retrieve'),
    }),
    execute: async (args) => {
      try {
        const { workspaceId, userId } = context
        const { documentId } = args

      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          userId,
          isDeleted: false,
        },
      })

      if (!workspace) {
        return {
          success: false,
          message: 'Workspace not found or access denied',
        }
      }

      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          workspaceId,
          isDeleted: false,
        },
      })

      if (!document) {
        return {
          success: false,
          message: 'Document not found or has been deleted',
        }
      }

      return {
        success: true,
        document: {
          id: document.id,
          title: document.title,
          content: document.content,
          type: document.documentType,
          currentVersion: document.currentVersion,
          lastEditedAt: document.lastEditedAt,
        },
        message: `Retrieved document "${document.title}" (version ${document.currentVersion})`,
      }
    } catch (error) {
      console.error('get_document error:', error)
      return {
        success: false,
        message: `Failed to retrieve document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
    },
  })

  /**
   * Update an existing document's content
 *
 * Use this tool when:
 * - User requests changes to existing documents
 * - Refining previously created content
 * - Adding new sections based on feedback
 *
 * Best practices:
 * - Call get_document first to retrieve current content
 * - Provide clear changeDescription
 * - Use 'replace' for full rewrites, 'append' for additions, 'prepend' for insertions
 * - Preserve document structure when making partial updates
 */
  const updateDocument = tool({
    description: "Update an existing document's content with version tracking",
    inputSchema: z.object({
      documentId: z.string().describe('The ID of the document to update'),
      content: z.string().describe('New content to apply (interpretation depends on changeType)'),
      changeType: z
        .enum(['replace', 'append', 'prepend'])
        .describe('How to apply the content: replace (full rewrite), append (add to end), prepend (add to beginning)'),
      changeDescription: z
        .string()
        .optional()
        .describe('Description of what changed (e.g., "Added payment requirements section")'),
    }),
    execute: async (args) => {
      try {
        const { workspaceId, userId, messageId } = context
        const { documentId, content, changeType, changeDescription } = args

      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          userId,
          isDeleted: false,
        },
      })

      if (!workspace) {
        return {
          success: false,
          message: 'Workspace not found or access denied',
        }
      }

      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          workspaceId,
          isDeleted: false,
        },
      })

      if (!document) {
        return {
          success: false,
          message: 'Document not found or has been deleted',
        }
      }

      let newContent: string
      switch (changeType) {
        case 'replace':
          newContent = content
          break
        case 'append':
          newContent = document.content + '\n\n' + content
          break
        case 'prepend':
          newContent = content + '\n\n' + document.content
          break
      }

      const newVersion = document.currentVersion + 1

      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
          content: newContent,
          currentVersion: newVersion,
          lastEditedAt: new Date(),
          generationPrompt: document.generationPrompt
            ? `${document.generationPrompt}\n\nVersion ${newVersion}: ${changeDescription || changeType}`
            : `Version ${newVersion}: ${changeDescription || changeType}`,
        },
      })

      const version = await prisma.documentVersion.create({
        data: {
          documentId,
          content: newContent,
          versionNumber: newVersion,
          createdBy: messageId,
        },
      })

      return {
        success: true,
        documentId: updatedDocument.id,
        versionId: version.id,
        title: updatedDocument.title,
        changeType,
        newVersion,
        message: `Document "${updatedDocument.title}" updated to version ${newVersion} (${changeType})`,
      }
    } catch (error) {
      console.error('update_document error:', error)
      return {
        success: false,
        message: `Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
    },
  })

  /**
   * List all documents in the current project
 *
 * Use this tool when:
 * - Before creating documents to avoid duplicates
 * - User asks "what documents do we have?"
 * - Need to reference existing documents
 * - Planning which documents to create or update
 *
 * Best practices:
 * - Use documentType filter when looking for specific types
 * - Check list before creating to avoid duplicates
 */
  const listDocuments = tool({
    description: 'List all documents in the current project',
    inputSchema: z.object({
      documentType: z
        .string()
        .optional()
        .describe('Optional filter by document type (e.g., "REQUIREMENT", "PRODUCT_DOCUMENT")'),
    }),
    execute: async (args) => {
      try {
        const { projectId, workspaceId, userId } = context
        const { documentType } = args

      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          userId,
          isDeleted: false,
        },
      })

      if (!workspace) {
        return {
          success: false,
          message: 'Workspace not found or access denied',
        }
      }

      const where: {
        workspaceId: string
        isDeleted: boolean
        projectId?: string
        documentType?: string
      } = {
        workspaceId,
        isDeleted: false,
      }

      if (projectId) {
        where.projectId = projectId
      }

      if (documentType) {
        where.documentType = documentType
      }

      const documents = await prisma.document.findMany({
        where,
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          documentType: true,
          icon: true,
          currentVersion: true,
          createdAt: true,
          lastEditedAt: true,
        },
      })

      return {
        success: true,
        count: documents.length,
        documents: documents.map((doc) => ({
          id: doc.id,
          title: doc.title,
          type: doc.documentType,
          icon: doc.icon || undefined,
          currentVersion: doc.currentVersion,
          createdAt: doc.createdAt,
          lastEditedAt: doc.lastEditedAt,
        })),
        message: documentType
          ? `Found ${documents.length} documents of type "${documentType}"`
          : `Found ${documents.length} documents in the project`,
      }
    } catch (error) {
      console.error('list_documents error:', error)
      return {
        success: false,
        message: `Failed to list documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
    },
  })

  return {
    create_document: createDocument,
    get_document: getDocument,
    update_document: updateDocument,
    list_documents: listDocuments,
  }
}
