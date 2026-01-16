import { createOpenAI } from '@ai-sdk/openai'
import { stepCountIs, tool, ToolLoopAgent } from 'ai'
import { z } from 'zod'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

const agentPrompt = `You are an AI assistant specialized in creating concise chat titles.

Your task is to generate a short, descriptive title based on the user's message.

Requirements:
- For Chinese: 3-15 characters
- For English: 2-6 words
- Capture the main topic or intent of the message
- Keep it concise and clear
- Use the same language as the user's message
- Use the validateChatTitle tool to check if the title meets requirements
- If validation fails, generate alternatives until you find a suitable title
- Only generate one title at a time,only response with the name,not other things

Process:
1. Analyze the user's message
2. Identify the main topic or intent
3. Generate a concise title
4. Validate it using the validateChatTitle tool
5. If valid, return the title; if not, refine and try again`

export const chatTitleAgent = new ToolLoopAgent({
  model: openai.chat('gemini-2.5-flash'),
  instructions: agentPrompt,
  tools: {
    validateChatTitle: tool({
      description: 'Validates if a chat title meets the requirements',
      inputSchema: z.object({
        title: z.string().describe('The chat title to validate'),
      }),
      execute: async ({ title }) => {
        const trimmedTitle = title.trim()
        const hasChinese = /[\u4e00-\u9fa5]/.test(trimmedTitle)

        let isValid: boolean
        let reason: string

        if (hasChinese) {
          const charLength = trimmedTitle.length
          isValid = charLength >= 3 && charLength <= 15
          reason = !isValid
            ? `Failed: ${charLength < 3 ? 'too short (minimum 3 characters)' : 'too long (maximum 15 characters)'}`
            : 'Valid chat title'
        } else {
          const words = trimmedTitle.split(/\s+/)
          const wordCount = words.length
          isValid = wordCount >= 2 && wordCount <= 6
          reason = !isValid
            ? `Failed: ${wordCount < 2 ? 'too short (minimum 2 words)' : 'too long (maximum 6 words)'}`
            : 'Valid chat title'
        }
        return {
          isValid,
          count: hasChinese ? trimmedTitle.length : trimmedTitle.split(/\s+/).length,
          reason,
        }
      },
    }),
  },
  stopWhen: stepCountIs(5),
  temperature: 0.7,
})

export async function generateChatTitle(message: string): Promise<string | null> {
  try {
    const result = await chatTitleAgent.generate({
      prompt: `Generate a chat title for this message: ${message}`,
    })

    const chatTitle = result.text
      .trim()
      .replace(/^[""'"`]|[""'"`]$/g, '')
      .trim()

    if (!chatTitle || chatTitle.length === 0 || chatTitle === message) {
      return null
    }

    return chatTitle
  } catch (error) {
    console.error('Failed to generate chat title:', error)
    return null
  }
}
