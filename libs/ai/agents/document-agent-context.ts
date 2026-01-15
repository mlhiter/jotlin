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
