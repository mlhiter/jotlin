import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk'
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

export async function* generateProjectWithClaudeAgent(
  requirements: string,
  modelConfig?: ModelConfig
): AsyncGenerator<GenerationProgress> {
  if (!process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new Error('ANTHROPIC_AUTH_TOKEN is required in environment variables')
  }

  const files: Record<string, string> = {}
  let stepIndex = 0

  const writeFileTool = tool(
    'write_file',
    'Create or update a file in the project. Use this tool to generate each file one by one.',
    {
      path: z.string().describe('File path relative to project root, e.g. "app/page.tsx"'),
      content: z.string().describe('Complete file content'),
    },
    async ({ path, content }) => {
      files[path] = content
      console.info(`[Claude Agent] Created file: ${path} (${content.length} chars)`)
      return {
        content: [
          {
            type: 'text' as const,
            text: `Successfully created ${path}. File now contains ${content.length} characters.`,
          },
        ],
      }
    }
  )

  const readFileTool = tool(
    'read_file',
    'Read a file that was previously created to check its content',
    {
      path: z.string().describe('File path to read'),
    },
    async ({ path }) => {
      if (files[path]) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `File ${path}:\n\n${files[path]}`,
            },
          ],
        }
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: File ${path} not found`,
          },
        ],
      }
    }
  )

  const listFilesTool = tool('list_files', 'List all files that have been created so far', {}, async () => {
    const fileList = Object.keys(files)
    console.info(`[Claude Agent] Files created: ${fileList.length}`)
    return {
      content: [
        {
          type: 'text' as const,
          text: `Files created (${fileList.length}):\n${fileList.join('\n')}`,
        },
      ],
    }
  })

  const mcpServer = createSdkMcpServer({
    name: 'code-generator',
    version: '1.0.0',
    tools: [writeFileTool, readFileTool, listFilesTool],
  })

  try {
    const startTime = Date.now()
    const logTime = (label: string) => {
      const elapsed = Date.now() - startTime
      console.info(`[Claude Agent] ${label} - Elapsed: ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`)
    }

    console.info('[Claude Agent] Starting project generation...')
    logTime('Started')

    yield {
      type: 'step',
      stepIndex: 0,
      message: 'Initializing Claude Agent...',
    }

    const systemPrompt = getClaudeAgentSystemPrompt()
    logTime('System prompt created')

    yield {
      type: 'step',
      stepIndex: 1,
      message: 'Setting up generation environment...',
    }

    console.info('[Claude Agent] Calling query()...')
    const modelName = modelConfig?.model || 'claude-sonnet-4-5-20250929'
    console.info(`[Claude Agent] Using model: ${modelName}`)

    const result = query({
      prompt: `${systemPrompt}\n\nUser Requirements:\n${requirements}`,
      options: {
        model: modelName,
        mcpServers: {
          'code-generator': mcpServer,
        },
        maxTurns: 20,
        settingSources: [],
        permissionMode: 'bypassPermissions',
      },
    })
    logTime('query() called, starting iteration')

    yield {
      type: 'step',
      stepIndex: 2,
      message: 'Connected to Claude, waiting for response...',
    }

    let totalInputTokens = 0
    let totalOutputTokens = 0
    let messageCount = 0
    let lastMessageTime = Date.now()

    // Timeout protection: if no message for 60 seconds, something is wrong
    const checkTimeout = () => {
      const timeSinceLastMessage = Date.now() - lastMessageTime
      if (timeSinceLastMessage > 60000) {
        console.error(`[Claude Agent] No message received for ${timeSinceLastMessage}ms, timing out`)
        throw new Error(`Generation timeout: no response for ${Math.floor(timeSinceLastMessage / 1000)}s`)
      }
    }

    const timeoutInterval = setInterval(checkTimeout, 5000) // Check every 5 seconds

    try {
      let previousFileCount = 0

      console.info('[Claude Agent] Starting to iterate over result messages...')
      for await (const message of result) {
        messageCount++
        lastMessageTime = Date.now()
        console.info(`[Claude Agent] Message #${messageCount}, type: ${message.type}`)
        logTime(`Message #${messageCount} received`)

        yield {
          type: 'step',
          message: `Processing message #${messageCount} (type: ${message.type})...`,
        }

        // Check if new files were created
        const currentFileCount = Object.keys(files).length
        if (currentFileCount > previousFileCount) {
          const newFiles = Object.keys(files).slice(previousFileCount)
          for (const fileName of newFiles) {
            console.info(`[Claude Agent] Yielding file_created event for: ${fileName}`)
            yield {
              type: 'file_created',
              fileName,
              fileCount: currentFileCount,
            }
          }
          previousFileCount = currentFileCount
        }

        if (message.type === 'assistant') {
          stepIndex++
          const fileCount = Object.keys(files).length
          const stepMessage = fileCount === 0 ? 'AI is analyzing requirements...' : `AI is generating files (${fileCount} created)...`
          console.info('[Claude Agent] Assistant message received')
          yield {
            type: 'step',
            stepIndex,
            message: stepMessage,
          }
        } else if (message.type === 'result') {
          totalInputTokens = message.usage.input_tokens
          totalOutputTokens = message.usage.output_tokens

          const cost = (totalInputTokens / 1000000) * 3.0 + (totalOutputTokens / 1000000) * 15.0

          console.info('[Claude Agent] Generation completed:', {
            fileCount: Object.keys(files).length,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            cost: `$${cost.toFixed(4)}`,
          })

          yield {
            type: 'completed',
            files,
            cost,
            fileCount: Object.keys(files).length,
          }
        } else {
          console.info('[Claude Agent] Other message type:', message.type)
        }
      }

      clearInterval(timeoutInterval)
      logTime('All messages received')

      if (Object.keys(files).length === 0) {
        throw new Error('No files generated')
      }
    } finally {
      clearInterval(timeoutInterval)
    }
  } catch (error) {
    console.error('[Claude Agent] Error:', error)
    yield {
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
    throw error
  }
}

function getClaudeAgentSystemPrompt(): string {
  return `You are an expert full-stack developer agent specialized in Next.js applications.

Your task is to generate a VERY SIMPLE, functional Next.js project by using the provided tools.

WORKFLOW:
1. Use write_file tool to create each file step by step
2. Create ONLY the essential files in this order:
   a. package.json (with "dev": "next dev --port 3000" script)
   b. tsconfig.json (minimal config)
   c. next.config.js (minimal config, use .js not .ts)
   d. tailwind.config.js (Tailwind v3 config)
   e. postcss.config.js (PostCSS config)
   f. app/globals.css (with Tailwind v3 directives)
   g. app/layout.tsx (simple root layout)
   h. app/page.tsx (KEEP THIS SIMPLE - max 200 lines)
3. Use list_files at the end to verify

CRITICAL RULES FOR app/page.tsx:
- KEEP IT VERY SIMPLE AND SHORT (under 200 lines)
- Use basic HTML and Tailwind classes only
- NO complex state management
- NO external libraries unless absolutely necessary
- Focus on a minimal working demo
- Use "use client" directive if you need any interactivity

IMPORTANT GUIDELINES:
- Use Next.js 14.2.16, React 18.3.1, TypeScript 5, Tailwind CSS 3.4.1
- Use Next.js App Router (app directory structure)
- Keep ALL code minimal and simple
- For Tailwind CSS 3, use standard @tailwind directives in globals.css
- Ensure all imports are correct and code is runnable
- CRITICAL: The dev script MUST be "next dev --port 3000" (explicit port for WebContainer)
- Keep dependencies minimal - only include what's absolutely necessary
- Use .js extension for config files (next.config.js, tailwind.config.js) for better compatibility

TOOLS AVAILABLE:
- write_file: Create a new file with content
- read_file: Read a previously created file
- list_files: List all files created so far

Start now by creating package.json with minimal dependencies. Work FAST and keep everything SIMPLE.`
}
