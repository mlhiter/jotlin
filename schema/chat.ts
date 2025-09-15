import { UIMessage } from 'ai'
import z from 'zod'

export const metadataSchema = z
  .object({
    answered: z.boolean(),
    selectedOptions: z.array(z.string()).optional(),
    inputValue: z.string().optional(),
    answeredAt: z.string().datetime(),
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
