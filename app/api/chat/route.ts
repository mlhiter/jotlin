import { createOpenAI } from '@ai-sdk/openai'
import { streamText, UIMessage, convertToModelMessages } from 'ai'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})
// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: openai.chat('gemini-2.5-pro'),
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
