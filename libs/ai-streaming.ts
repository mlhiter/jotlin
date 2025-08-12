import { ChatOpenAI } from '@langchain/openai'
import { BaseMessage } from '@langchain/core/messages'
import { requirementApi } from '@/api/requirements'
import { createDocumentsFromRequirements } from '@/libs/requirement-document-generator'

export class StreamingChatAgent {
  private llm: ChatOpenAI

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY,
      streaming: true,
      configuration: {
        baseURL: process.env.OPENAI_BASE_URL,
      },
    })
  }

  async *streamResponse(
    userMessage: string,
    conversationHistory: BaseMessage[],
    documentContext?: string,
    chatId?: string
  ): AsyncGenerator<string, void, unknown> {
    try {
      // Check if this is a requirement generation trigger
      const shouldGenerateRequirements = this.isRequirementGenerationTrigger(
        userMessage,
        conversationHistory
      )

      const systemPrompt = this.buildSystemPrompt(
        documentContext,
        shouldGenerateRequirements
      )
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-8).map((msg) => ({
          role: msg.constructor.name === 'HumanMessage' ? 'user' : 'assistant',
          content: msg.content as string,
        })),
        { role: 'user', content: userMessage },
      ]

      const stream = await this.llm.stream(messages)
      let fullResponse = ''

      for await (const chunk of stream) {
        if (chunk.content) {
          const content = chunk.content as string
          fullResponse += content
          yield content
        }
      }

      // After streaming the response, check if we should generate requirements
      if (shouldGenerateRequirements && chatId) {
        yield '\n\n🤖 正在为您生成需求文档...\n\n'

        try {
          // Generate requirements only, don't create documents on server side
          const response = await requirementApi.generateRequirements({
            initial_requirements: userMessage,
          })

          // Signal the frontend to start showing progress
          yield `__DOCUMENT_GENERATION_START__:${JSON.stringify({
            chatId,
            taskId: response.task_id,
          })}\n`

          // Poll for completion with progress updates by manually polling
          let isCompleted = false
          let lastProgress = 0
          let results: any = null

          while (!isCompleted) {
            try {
              const status = await requirementApi.getGenerationStatus(
                response.task_id
              )

              // Send progress update if changed
              if (status.progress > lastProgress) {
                lastProgress = status.progress
                yield `__GENERATION_PROGRESS__:${JSON.stringify({
                  progress: status.progress,
                  message: status.message,
                  status: status.status,
                })}\n`
              }

              if (status.status === 'completed') {
                isCompleted = true
                results = await requirementApi.getFormattedResults(
                  response.task_id
                )
              } else if (status.status === 'failed') {
                throw new Error(
                  status.message || 'Requirement generation failed'
                )
              }

              // Wait before next poll if not completed
              if (!isCompleted) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
              }
            } catch (error) {
              console.error('Error polling status:', error)
              throw error
            }
          }

          if (results.documents && results.documents.length > 0) {
            yield `✅ 已成功分析并生成 ${results.documents.length} 个需求文档。正在为您创建文档...\n\n`

            // Signal the frontend to create documents with full data
            yield `__DOCUMENTS_GENERATED__:${JSON.stringify({
              chatId,
              documents: results.documents,
            })}\n`
          } else {
            yield '❌ 需求文档生成失败，请稍后重试。\n'
          }
        } catch (error) {
          console.error('Background requirement generation failed:', error)
          yield '❌ 需求文档生成失败，请稍后重试。\n'
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      yield 'Sorry, I encountered an error while processing your request.'
    }
  }

  /**
   * Check if the user message indicates they want to create a project/software
   */
  private isRequirementGenerationTrigger(
    userMessage: string,
    conversationHistory: BaseMessage[]
  ): boolean {
    // Only trigger on first message or if no previous assistant responses
    const hasAssistantResponse = conversationHistory.some(
      (msg) => msg.constructor.name === 'AIMessage'
    )

    if (hasAssistantResponse) {
      return false
    }

    const lowerMessage = userMessage.toLowerCase()

    // Keywords that indicate project creation intent
    const projectKeywords = [
      '我想做',
      '我要做',
      '我想开发',
      '我要开发',
      '我想创建',
      '我要创建',
      '我想建立',
      '我要建立',
      '我想实现',
      '我要实现',
      '我想写',
      '我需要',
      '帮我做',
      '帮我开发',
      '帮我创建',
      '帮我建立',
      '一个网站',
      '一个系统',
      '一个应用',
      '一个平台',
      '一个项目',
      '博客',
      '商城',
      '管理系统',
      '后台',
      '前端',
      '网页',
      '小程序',
      'app',
      '应用程序',
      '软件',
    ]

    return projectKeywords.some((keyword) => lowerMessage.includes(keyword))
  }

  private buildSystemPrompt(
    documentContext?: string,
    shouldGenerateRequirements?: boolean
  ): string {
    let prompt = `You are an AI assistant integrated into Jotlin, a Notion-like document editor.
Help users with their documents and provide intelligent assistance.

Key capabilities:
- Answer questions about documents
- Help with writing and editing
- Provide summaries and insights
- Assist with document organization`

    if (shouldGenerateRequirements) {
      prompt += `
- Generate detailed project requirements and documentation

When a user describes wanting to create/develop/build something, provide helpful advice and let them know that detailed requirement documents will be automatically generated for them.`
    }

    prompt += `

Be helpful, accurate, and conversational.`

    if (documentContext) {
      prompt += `\n\nLinked Documents:\n${documentContext}`
    }

    return prompt
  }
}

export const streamingChatAgent = new StreamingChatAgent()
