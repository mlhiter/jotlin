import { NextRequest } from 'next/server'

import { generateProjectWithClaudeAgent } from '@/libs/ai/claude-agent-generator'
import { getSessionFromRequest } from '@/libs/auth/auth'
import { prisma } from '@/libs/utils/prisma'

// Increase timeout to 5 minutes for code generation
export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { requirements, chatId } = await req.json()

  // Create a ReadableStream for SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const startTime = Date.now()
      let currentProgress = 0

      // Helper to send SSE event
      const sendEvent = (event: {
        type: string
        message?: string
        fileName?: string
        progress?: number
        status?: string
        files?: Record<string, string>
        cost?: string
        error?: string
      }) => {
        const data = `data: ${JSON.stringify({ ...event, timestamp: Date.now() })}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      try {
        let files: Record<string, string> = {}
        let cost = 0

        const modelConfig = { model: 'claude-sonnet-4-5-20250929' }

        currentProgress = 5

        for await (const progressEvent of generateProjectWithClaudeAgent(requirements, modelConfig)) {
          if (progressEvent.type === 'completed' && progressEvent.files) {
            files = progressEvent.files
            cost = progressEvent.cost || 0
            currentProgress = 90
            sendEvent({
              type: 'info',
              message: `Generated ${Object.keys(files).length} files (cost: $${cost.toFixed(4)})`,
              progress: currentProgress,
            })
          } else if (progressEvent.type === 'step') {
            currentProgress = Math.min(currentProgress + 5, 85)
            sendEvent({
              type: 'step',
              message: progressEvent.message || 'Processing...',
              progress: currentProgress,
            })
          } else if (progressEvent.type === 'file_created') {
            sendEvent({
              type: 'file_created',
              message: 'Created file',
              fileName: progressEvent.fileName,
              progress: currentProgress,
            })
          }
        }

        if (Object.keys(files).length === 0) {
          throw new Error('No files generated')
        }

        sendEvent({ type: 'info', message: 'Saving to database...', progress: 95 })

        await prisma.mvp.upsert({
          where: { chatId },
          update: {
            files: files,
            requirementSnapshot: requirements,
            status: 'completed',
            updatedAt: new Date(),
          },
          create: {
            chatId,
            files: files,
            requirementSnapshot: requirements,
            status: 'completed',
          },
        })

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        sendEvent({
          type: 'completed',
          message: `Completed! Total time: ${elapsed}s`,
          progress: 100,
          status: 'completed',
          files,
          cost: `$${cost.toFixed(4)}`,
        })

        controller.close()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate MVP'
        sendEvent({
          type: 'error',
          message: errorMessage,
          status: 'error',
          error: errorMessage,
          progress: currentProgress,
        })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
