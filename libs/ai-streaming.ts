import { ChatOpenAI } from '@langchain/openai'
import { BaseMessage } from '@langchain/core/messages'

export class StreamingChatAgent {
  private llm: ChatOpenAI

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY,
      streaming: true,
    })
  }

  async *streamResponse(
    userMessage: string,
    conversationHistory: BaseMessage[],
    documentContext?: string
  ): AsyncGenerator<string, void, unknown> {
    try {
      const systemPrompt = this.buildSystemPrompt(documentContext)
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-8).map((msg) => ({
          role: msg.constructor.name === 'HumanMessage' ? 'user' : 'assistant',
          content: msg.content as string,
        })),
        { role: 'user', content: userMessage },
      ]

      const stream = await this.llm.stream(messages)

      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content as string
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      yield 'Sorry, I encountered an error while processing your request.'
    }
  }

  private buildSystemPrompt(documentContext?: string): string {
    let prompt = `You are an AI assistant integrated into Jotlin, a Notion-like document editor.
Help users with their documents and provide intelligent assistance.

Key capabilities:
- Answer questions about documents
- Help with writing and editing
- Provide summaries and insights
- Assist with document organization

Be helpful, accurate, and conversational.`

    if (documentContext) {
      prompt += `\n\nLinked Documents:\n${documentContext}`
    }

    return prompt
  }
}

export const streamingChatAgent = new StreamingChatAgent()
