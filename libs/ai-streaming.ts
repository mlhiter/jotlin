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
      const shouldGenerateRequirements = this.isRequirementGenerationTrigger(userMessage, conversationHistory)
      
      const systemPrompt = this.buildSystemPrompt(documentContext, shouldGenerateRequirements)
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
            initial_requirements: userMessage
          })

          // Poll for completion with progress updates
          const results = await requirementApi.pollForCompletion(
            response.task_id,
            (progress) => {
              console.log(`Progress: ${progress.progress}% - ${progress.message}`)
            },
            1000
          )
          
          if (results.documents && results.documents.length > 0) {
            yield `✅ 已成功生成 ${results.documents.length} 个需求文档。正在创建文档...\n\n`
            
            // Signal the frontend to create documents
            // We'll emit a special message that the frontend can catch
            yield `__DOCUMENTS_GENERATED__:${JSON.stringify({
              chatId,
              documents: results.documents
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
      '我想做', '我要做', '我想开发', '我要开发', '我想创建', '我要创建',
      '我想建立', '我要建立', '我想实现', '我要实现', '我想写',
      '我需要', '帮我做', '帮我开发', '帮我创建', '帮我建立',
      '一个网站', '一个系统', '一个应用', '一个平台', '一个项目',
      '博客', '商城', '管理系统', '后台', '前端', '网页',
      '小程序', 'app', '应用程序', '软件'
    ]

    return projectKeywords.some(keyword => lowerMessage.includes(keyword))
  }

  /**
   * Generate requirements with progress updates and create documents
   */
  private async generateRequirementsWithProgress(
    userMessage: string,
    chatId: string,
    onProgress?: (progress: any) => void
  ): Promise<string[]> {
    try {
      // Start requirement generation
      const response = await requirementApi.generateRequirements({
        initial_requirements: userMessage
      })

      // Poll for completion with progress updates
      const results = await requirementApi.pollForCompletion(
        response.task_id,
        onProgress,
        1000 // Poll every 1 second for more responsive updates
      )
      
      // Create documents from the generated requirements
      const documentIds = await createDocumentsFromRequirements(results.documents, { chatId })
      
      console.log(`Generated ${documentIds.length} requirement documents for chat ${chatId}`)
      return documentIds
    } catch (error) {
      console.error('Requirement generation and document creation failed:', error)
      throw error
    }
  }

  /**
   * Generate requirements and create documents (legacy method for compatibility)
   */
  private async generateRequirementsAndCreateDocuments(
    userMessage: string,
    chatId: string
  ): Promise<string[]> {
    return this.generateRequirementsWithProgress(userMessage, chatId)
  }

  private buildSystemPrompt(documentContext?: string, shouldGenerateRequirements?: boolean): string {
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
