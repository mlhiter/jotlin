import { createOpenAI } from '@ai-sdk/openai'
import { Output, ToolLoopAgent } from 'ai'
import z from 'zod'

import { createDocumentTool, getDocumentTool, updateDocumentTool, listDocumentsTool } from '../tools/document'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

export const productDocumentAgent = new ToolLoopAgent({
  model: openai('gemini-2.5-pro'),
  instructions:
    'You are a Product Document Generation Agent. Your goal is to create comprehensive product documents based on requirement inputs.',
  tools: {
    create_document: createDocumentTool,
    get_document: getDocumentTool,
    update_document: updateDocumentTool,
    list_documents: listDocumentsTool,
  },
  output: Output.object({
    schema: z.object({
      documentId: z.string().describe('The ID of the created or updated product document'),
    }),
  }),
})
