import { ChatOpenAI } from '@langchain/openai'
import { BaseMessage } from '@langchain/core/messages'

class DocumentChatAgent {
  private llm: ChatOpenAI

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  private async analyzeQuery(userQuery: string): Promise<{
    taskType: string
    needsDocumentAnalysis: boolean
  }> {
    if (!process.env.OPENAI_API_KEY) {
      return { taskType: 'chat', needsDocumentAnalysis: false }
    }

    try {
      const analysisPrompt = `Analyze this user query and determine the task type:
Query: "${userQuery}"

Possible types:
- chat: General conversation
- document_analysis: Questions about specific documents
- writing_assistance: Help with writing or editing
- qa: Question answering about content

Also determine if document analysis is needed (true/false).

Respond in JSON format: {"taskType": "...", "needsDocumentAnalysis": true/false}`

      const response = await this.llm.invoke([
        { role: 'system', content: analysisPrompt },
      ])

      const analysis = JSON.parse(response.content as string)
      return {
        taskType: analysis.taskType || 'chat',
        needsDocumentAnalysis: analysis.needsDocumentAnalysis || false,
      }
    } catch (e) {
      console.warn('Failed to analyze query, using defaults')
      return { taskType: 'chat', needsDocumentAnalysis: false }
    }
  }

  private async analyzeDocuments(documentContext: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY || !documentContext) {
      return ''
    }

    try {
      const analysisPrompt = `Analyze the following documents and create a concise summary:

${documentContext}

Provide a structured summary that includes:
1. Key topics and themes
2. Important facts or data
3. Main conclusions or insights
4. Relevant context for answering questions

Keep the summary concise but comprehensive.`

      const response = await this.llm.invoke([
        { role: 'system', content: analysisPrompt },
      ])

      return response.content as string
    } catch (e) {
      console.warn('Failed to analyze documents')
      return ''
    }
  }

  private buildSystemPrompt(
    taskType?: string,
    documentContext?: string,
    documentSummary?: string
  ): string {
    let prompt = `You are an AI assistant integrated into Jotlin, a Notion-like document editor.
You help users with their documents and provide intelligent assistance.

Current task type: ${taskType || 'chat'}

Key capabilities:
- Answer questions about documents using provided context
- Help with writing and editing tasks
- Provide summaries and insights from document content
- Assist with document organization and structure
- General conversation and assistance

Guidelines:
- Be helpful, accurate, and concise
- When referencing documents, cite specific content when relevant
- For writing assistance, provide constructive suggestions
- Always consider the document context when available`

    if (documentSummary) {
      prompt += `\n\nDocument Analysis Summary:\n${documentSummary}`
    } else if (documentContext) {
      prompt += `\n\nLinked Documents:\n${documentContext}`
    }

    return prompt
  }

  async processMessage(
    userMessage: string,
    conversationHistory: BaseMessage[],
    documentContext?: string
  ): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return 'AI functionality is not configured. Please add your OpenAI API key to the environment variables.'
      }

      const queryAnalysis = await this.analyzeQuery(userMessage)

      let documentSummary = ''
      if (queryAnalysis.needsDocumentAnalysis && documentContext) {
        documentSummary = await this.analyzeDocuments(documentContext)
      }

      const systemPrompt = this.buildSystemPrompt(
        queryAnalysis.taskType,
        documentContext,
        documentSummary
      )

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-8).map((msg) => ({
          role: msg.constructor.name === 'HumanMessage' ? 'user' : 'assistant',
          content: msg.content as string,
        })),
        { role: 'user', content: userMessage },
      ]

      const response = await this.llm.invoke(messages)
      return response.content as string
    } catch (error) {
      console.error('AI processing error:', error)
      return 'Sorry, I encountered an error while processing your request. Please try again.'
    }
  }
}

export const documentChatAgent = new DocumentChatAgent()
