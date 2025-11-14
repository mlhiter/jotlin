import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { z } from 'zod'

export interface GenerationProgress {
  type: 'step' | 'completed' | 'error' | 'file_created'
  stepIndex?: number
  message?: string
  files?: Record<string, string>
  cost?: number
  fileName?: string
  fileCount?: number
}

interface ModelConfig {
  model?: string
}

export async function* generateProjectWithVercelAI(
  requirements: string,
  modelConfig?: ModelConfig
): AsyncGenerator<GenerationProgress> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required in environment variables')
  }

  const openai = createOpenAI({
    baseURL: process.env.OPENAI_API_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  })
  const files: Record<string, string> = {}
  let stepIndex = 0

  const tools = {
    write_file: {
      description: 'Create or update a file in the project. Use this tool to generate each file one by one.',
      inputSchema: z.object({
        path: z.string().describe('File path relative to project root, e.g. "app/page.tsx"'),
        content: z.string().describe('Complete file content'),
      }),
      execute: async ({ path, content }: { path: string; content: string }) => {
        files[path] = content
        return `Successfully created ${path}. File now contains ${content.length} characters.`
      },
    },
    read_file: {
      description: 'Read a file that was previously created to check its content',
      inputSchema: z.object({
        path: z.string().describe('File path to read'),
      }),
      execute: async ({ path }: { path: string }) => {
        if (files[path]) {
          return `File ${path}:\n\n${files[path]}`
        }
        return `Error: File ${path} not found`
      },
    },
    list_files: {
      description: 'List all files that have been created so far',
      inputSchema: z.object({}),
      execute: async () => {
        const fileList = Object.keys(files)
        return `Files created (${fileList.length}):\n${fileList.join('\n')}`
      },
    },
  }

  try {
    yield {
      type: 'step',
      stepIndex: 0,
      message: 'Initializing Claude...',
    }

    const systemPrompt = getSystemPrompt()
    const modelName = modelConfig?.model || 'claude-sonnet-4-5-20250929'

    yield {
      type: 'step',
      stepIndex: 1,
      message: 'Setting up generation environment...',
    }

    let previousFileCount = 0

    const result = streamText({
      model: openai.chat(modelName),
      system: systemPrompt,
      prompt: `User Requirements:\n${requirements}`,
      tools,
      stopWhen: ({ steps }) => {
        // Get the last step's finish reason
        const lastStep = steps[steps.length - 1]
        // Continue as long as the model is calling tools
        // Only stop when model decides to stop naturally
        return lastStep?.finishReason !== 'tool-calls'
      },
      onStepFinish: () => {
        stepIndex++
      },
    })

    // Consume the full stream to get all events including tool calls
    for await (const part of result.fullStream) {
      if (part.type === 'finish-step') {
        // Yield progress for each step completion
        const currentFileCount = Object.keys(files).length

        yield {
          type: 'step',
          stepIndex: stepIndex,
          message: `Step ${stepIndex} completed (${currentFileCount} files created)`,
        }

        // Check if new files were created in this step
        if (currentFileCount > previousFileCount) {
          const newFiles = Object.keys(files).slice(previousFileCount)

          for (const fileName of newFiles) {
            yield {
              type: 'file_created',
              fileName,
              message: `Created ${fileName}`,
            }
          }
          previousFileCount = currentFileCount
        }
      }
    }

    if (Object.keys(files).length === 0) {
      throw new Error('No files generated')
    }

    // Calculate cost (Sonnet 4.5 pricing: $3/1M input, $15/1M output)
    const usage = await result.usage
    const totalTokens = usage.totalTokens || 0
    const inputTokens = Math.floor(totalTokens * 0.4) // Estimate 40% input
    const outputTokens = Math.floor(totalTokens * 0.6) // Estimate 60% output
    const cost = (inputTokens / 1000000) * 3.0 + (outputTokens / 1000000) * 15.0

    yield {
      type: 'completed',
      files,
      cost,
      fileCount: Object.keys(files).length,
    }
  } catch (error) {
    console.error('[Vercel AI] Error:', error)
    yield {
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
    throw error
  }
}

function getSystemPrompt(): string {
  return `You are an expert full-stack developer agent specialized in Next.js applications.

You will receive comprehensive project documentation including:
1. Requirements Analysis Document - defining WHAT needs to be built and WHY
2. Technical Architecture Document - defining HOW it should be structured
3. Development Plan Document - providing detailed implementation guidance

Your task is to generate a functional Next.js project that strictly follows these documents.

WORKFLOW:
1. First, carefully read and understand ALL three documents
2. Identify the core features from Requirements Document
3. Follow the architecture patterns from Technical Architecture Document
4. Implement according to the Development Plan's task breakdown
5. Use write_file tool to create each file step by step
6. Create files in this recommended order:
   a. package.json (with "dev": "next dev --port 3000" script)
   b. tsconfig.json (minimal config)
   c. next.config.js (minimal config, use .js not .ts)
   d. tailwind.config.js (Tailwind v3 config)
   e. postcss.config.js (PostCSS config)
   f. app/globals.css (with Tailwind v3 directives)
   g. app/layout.tsx (simple root layout)
   h. app/page.tsx (KEEP THIS SIMPLE - max 200 lines)
7. Use list_files at the end to verify

CRITICAL IMPLEMENTATION RULES:
- Strictly align with the Requirements Document's in-scope features
- Follow the Technical Architecture Document's technology choices and patterns
- Implement according to the Development Plan's task breakdown
- For app/page.tsx: Keep it under 200 lines, focus on core functionality
- Use "use client" directive if you need any interactivity
- Prioritize features based on the Development Plan's task priorities

IMPORTANT GUIDELINES:
- Use Next.js 14.2.16, React 18.3.1, TypeScript 5.6.3, Tailwind CSS 3.4.1
- Use Next.js App Router (app directory structure)
- Keep ALL code minimal and simple
- For Tailwind CSS 3, use standard @tailwind directives in globals.css
- Ensure all imports are correct and code is runnable
- CRITICAL: The dev script MUST be "next dev --port 3000" (explicit port for WebContainer)
- Keep dependencies minimal - only include what's absolutely necessary
- Use .js extension for config files (next.config.js, tailwind.config.js) for better compatibility

CRITICAL DEPENDENCY VERSION RULES:
- typescript: MUST use "5.6.3" (NOT 5.0.0, 5.0.x, or 5.x - these don't exist!)
- @types/react: "18.3.12"
- @types/node: "22.10.5"
- next: "14.2.16"
- react: "18.3.1"
- react-dom: "18.3.1"
- tailwindcss: "3.4.1"
- Always use EXACT versions (no ^ or ~) for better WebContainer compatibility

TOOLS AVAILABLE:
- write_file: Create a new file with content
- read_file: Read a previously created file
- list_files: List all files created so far

Start now by creating package.json with minimal dependencies. Work FAST and keep everything SIMPLE.`
}
