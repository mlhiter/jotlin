import { createOpenAI } from '@ai-sdk/openai'
import { stepCountIs, tool, ToolLoopAgent } from 'ai'
import { z } from 'zod'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

const agentPrompt = `You are an AI assistant specialized in creating concise and meaningful project names.

Your task is to generate a project name based on the user's description.

Requirements:
- For Chinese names: 4-20 characters
- For English names: 2-10 words
- It should be descriptive and memorable
- It should be in User Language
- Use the validateProjectName tool to check if the name meets requirements
- If validation fails, generate alternatives until you find a suitable name
- Only generate one name at a time

Process:
1. Analyze the user's description
2. Generate a project name
3. Validate it using the validateProjectName tool
4. If valid, return the name; if not, refine and try again`

export const projectNameAgent = new ToolLoopAgent({
  model: openai.chat('gemini-2.5-pro'),
  instructions: agentPrompt,
  tools: {
    validateProjectName: tool({
      description: 'Validates if a project name meets the requirements',
      inputSchema: z.object({
        name: z.string().describe('The project name to validate'),
      }),
      execute: async ({ name }) => {
        const trimmedName = name.trim()

        const hasChinese = /[\u4e00-\u9fa5]/.test(trimmedName)

        let isValid: boolean
        let reason: string

        if (hasChinese) {
          const charLength = trimmedName.length
          isValid = charLength >= 4 && charLength <= 20
          reason = !isValid
            ? `Failed: ${charLength < 4 ? 'too short (minimum 4 characters)' : 'too long (maximum 20 characters)'}`
            : 'Valid project name'
        } else {
          const words = trimmedName.split(/\s+/)
          const wordCount = words.length
          isValid = wordCount >= 2 && wordCount <= 10
          reason = !isValid
            ? `Failed: ${wordCount < 2 ? 'too short (minimum 2 words)' : 'too long (maximum 10 words)'}`
            : 'Valid project name'
        }
        return {
          isValid,
          wordCount: hasChinese ? trimmedName.length : trimmedName.split(/\s+/).length,
          reason,
        }
      },
    }),
  },
  stopWhen: stepCountIs(5),
  temperature: 0.7,
})
