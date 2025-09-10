import { createOpenAI } from '@ai-sdk/openai'
import { streamText, UIMessage, convertToModelMessages } from 'ai'

import { requirementAnalysisPrompt } from '@/lib/prompt'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
  // fetch: (input, init) => {
  //   return fetch(input, init)
  // },
})
// Allow streaming responses up to 30 seconds
// export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: openai.chat('gemini-2.5-flash'),
    system: requirementAnalysisPrompt,
    messages: convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
