import { tool } from 'ai'
import { z } from 'zod'

import { prisma } from '@/libs/utils/prisma'
import { DocumentToolContext, documentTypes } from '@/types/document'

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
export const createDocumentTool = tool({
  description: 'Create a new document in the project with version tracking',
  inputSchema: z.object({
    title: z.string().describe('Document title (e.g., "E-commerce Platform Requirements")'),
    type: z.enum(documentTypes).describe('Document type (e.g., "REQUIREMENT", "PRODUCT_DOCUMENT", "CUSTOM")'),
    content: z.string().describe('Complete document content in Markdown format'),
    icon: z.string().optional().describe('Document icon emoji (default: 📄)'),
    description: z.string().optional().describe('Optional document description'),
  }),
  execute: async (args, { experimental_context: context }) => {
    try {
      const { chatThreadId, projectId, workspaceId, userId, messageId } = context as DocumentToolContext
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

        // Transaction: Create version snapshot + Update document + Cleanup old versions
        const result = await prisma.$transaction(async (tx) => {
          // 1. Create version snapshot of CURRENT state (old version + old content)
          // Check if version snapshot already exists to avoid unique constraint error
          let version = await tx.documentVersion.findFirst({
            where: {
              documentId: existingDocument.id,
              versionNumber: existingDocument.currentVersion,
            },
          })

          // Only create if it doesn't exist
          if (!version) {
            version = await tx.documentVersion.create({
              data: {
                documentId: existingDocument.id,
                content: existingDocument.content, // OLD content
                versionNumber: existingDocument.currentVersion, // OLD version number
                createdBy: messageId,
              },
            })
          }

          // 2. Update document with NEW content
          const updatedDocument = await tx.document.update({
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

          // 3. Cleanup old versions (keep last 50)
          const versionCount = await tx.documentVersion.count({
            where: { documentId: existingDocument.id },
          })

          if (versionCount > 50) {
            const toDelete = await tx.documentVersion.findMany({
              where: { documentId: existingDocument.id },
              orderBy: { versionNumber: 'asc' },
              take: versionCount - 50,
              select: { id: true },
            })

            await tx.documentVersion.deleteMany({
              where: {
                id: { in: toDelete.map((v) => v.id) },
              },
            })
          }

          return { updatedDocument, version }
        })

        return {
          success: true,
          documentId: result.updatedDocument.id,
          versionId: result.version.id,
          title: result.updatedDocument.title,
          type: result.updatedDocument.documentType,
          message: `Document "${title}" updated to version ${newVersion}${type === 'REQUIREMENT' ? '. Related documents (Product Doc, Flowchart, Sitemap, Wireframe) are being automatically regenerated.' : ''}`,
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
        message: `Document "${title}" created successfully with version 1${type === 'REQUIREMENT' ? '. Related documents (Product Doc, Flowchart, Sitemap, Wireframe) are being generated automatically.' : ''}`,
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
export const getDocumentTool = tool({
  description: "Retrieve a document's current content and metadata",
  inputSchema: z.object({
    documentId: z.string().describe('The ID of the document to retrieve'),
  }),
  execute: async (args, { experimental_context: context }) => {
    try {
      const { workspaceId, userId } = context as DocumentToolContext
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
export const updateDocumentTool = tool({
  description:
    "Update an existing document's content with version tracking. CRITICAL: You MUST call get_document first to retrieve the current content before calling this tool.",
  inputSchema: z.object({
    documentId: z.string().describe('The ID of the document to update'),
    currentContentSummary: z
      .string()
      .describe(
        'Brief summary of the CURRENT document content obtained from get_document (e.g., "Document has 3 sections: Core Vision, Target Users, Features"). This proves you called get_document first. Minimum 30 characters required.'
      ),
    content: z.string().describe('New content to apply (interpretation depends on changeType)'),
    changeType: z
      .enum(['replace', 'append', 'prepend'])
      .describe('How to apply the content: replace (full rewrite), append (add to end), prepend (add to beginning)'),
    changeDescription: z
      .string()
      .optional()
      .describe('Description of what changed (e.g., "Added payment requirements section")'),
  }),
  execute: async (args, { experimental_context: context }) => {
    try {
      const { workspaceId, userId, messageId } = context as DocumentToolContext
      const { documentId, currentContentSummary, content, changeType, changeDescription } = args

      // Validate that currentContentSummary was provided (ensures get_document was called)
      if (!currentContentSummary || currentContentSummary.trim().length < 30) {
        return {
          success: false,
          message:
            'CRITICAL ERROR: You must call get_document first to retrieve the current document content, then provide a summary (minimum 30 characters) in the currentContentSummary parameter. This ensures your update is context-aware and flows naturally with existing content.',
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

      // Transaction: Create version snapshot BEFORE update + Update document + Cleanup old versions
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create version snapshot of CURRENT state (old version + old content)
        // Check if version snapshot already exists to avoid unique constraint error
        let version = await tx.documentVersion.findFirst({
          where: {
            documentId,
            versionNumber: document.currentVersion,
          },
        })

        // Only create if it doesn't exist
        if (!version) {
          version = await tx.documentVersion.create({
            data: {
              documentId,
              content: document.content, // OLD content
              versionNumber: document.currentVersion, // OLD version number
              createdBy: messageId,
            },
          })
        }

        // 2. Update document with NEW content
        const updatedDocument = await tx.document.update({
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

        // 3. Cleanup old versions (keep last 50)
        const versionCount = await tx.documentVersion.count({
          where: { documentId },
        })

        if (versionCount > 50) {
          const toDelete = await tx.documentVersion.findMany({
            where: { documentId },
            orderBy: { versionNumber: 'asc' },
            take: versionCount - 50,
            select: { id: true },
          })

          await tx.documentVersion.deleteMany({
            where: {
              id: { in: toDelete.map((v) => v.id) },
            },
          })
        }

        return { updatedDocument, version }
      })

      return {
        success: true,
        documentId: result.updatedDocument.id,
        versionId: result.version.id,
        title: result.updatedDocument.title,
        changeType,
        newVersion,
        message: `Document "${result.updatedDocument.title}" updated to version ${newVersion} (${changeType}: ${changeDescription || 'content updated'})`,
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
export const listDocumentsTool = tool({
  description: 'List all documents in the current project',
  inputSchema: z.object({
    documentType: z
      .enum(documentTypes)
      .optional()
      .describe('Optional filter by document type (e.g., "REQUIREMENT", "PRODUCT_DOCUMENT")'),
  }),
  execute: async (args, { experimental_context: context }) => {
    try {
      const { projectId, workspaceId, userId } = context as DocumentToolContext
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
