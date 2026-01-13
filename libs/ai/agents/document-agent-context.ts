/**
 * Agent context for document generation
 * Provides tools and context for agents to generate and manage documents
 */

import type { DocumentToolContext } from '../tools/types'

export interface DocumentAgentContext extends DocumentToolContext {
  requirementDocId: string
  requirementContent: string
}

/**
 * Create a system message for document generation agents
 */
export function createAgentSystemMessage(documentType: string, context: DocumentAgentContext): string {
  const baseMessage = `You are a professional ${documentType} generation agent.

Your task is to generate a high-quality ${documentType} based on the requirement document provided.

## Available Tools

You have access to the following tools:
- **create_document**: Create a new document in the project
- **get_document**: Retrieve existing document content
- **update_document**: Update an existing document
- **list_documents**: List all documents in the project

## Important Guidelines

1. **Always use tools**: You MUST use the create_document tool to save your generated content
2. **Be thorough**: Generate comprehensive, well-structured content
3. **Follow format**: Use Markdown formatting for all content
4. **No explanations**: After creating the document, simply confirm completion - no need for lengthy explanations

## Context

- Project ID: ${context.projectId || 'N/A'}
- Workspace ID: ${context.workspaceId}
- Chat Thread ID: ${context.chatThreadId}
- Requirement Document ID: ${context.requirementDocId}
`

  return baseMessage
}

/**
 * Create user message for agent with requirement content
 */
export function createAgentUserMessage(documentType: string, requirementContent: string): string {
  return `Generate a ${documentType} based on the following requirement document:

<requirement>
${requirementContent}
</requirement>

Please:
1. Analyze the requirement document carefully
2. Generate a comprehensive ${documentType}
3. Use the create_document tool to save your work with:
   - type: "${documentType}"
   - title: An appropriate title
   - content: Your generated content in Markdown format
   - icon: An appropriate emoji

Remember: You MUST use the create_document tool to save the document. Do not just output the content.`
}
