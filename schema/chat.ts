import { UIMessage } from 'ai'
import z from 'zod'

export const documentTypeSchema = z.enum(['REQUIREMENT', 'PRODUCT_DOCUMENT', 'FLOWCHART', 'SITEMAP', 'WIREFRAME', 'CUSTOM'])

export type DocumentType = z.infer<typeof documentTypeSchema>

export const metadataSchema = z
  .object({
    answered: z.boolean().optional(),
    selectedOptions: z.array(z.string()).optional(),
    inputValue: z.string().optional(),
    answeredAt: z.string().datetime().optional(),
    isVersionSnapshot: z.boolean().optional(),
    versionTitle: z.string().optional(),
    versionType: z.enum(['draft', 'final']).optional(),
    documentType: documentTypeSchema.optional(),
    versionGroupId: z.string().uuid().optional(),
    generatedFrom: z.string().optional(),
    toolCallId: z.string().optional(),
    toolName: z.string().optional(),
    isCollapsed: z.boolean().optional(),
    affectedDocumentIds: z.array(z.string()).optional(),
  })
  .nullish()

type MyMetadata = z.infer<typeof metadataSchema>

// const dataPartSchema = z.object({
//   someDataPart: z.object({}),
//   anotherDataPart: z.object({}),
// })

// type MyDataPart = z.infer<typeof dataPartSchema>

// const tools = {
//   someTool: tool({}),
// } satisfies ToolSet

// type MyTools = InferUITools<typeof tools>

export type MyUIMessage = UIMessage<MyMetadata | null>
