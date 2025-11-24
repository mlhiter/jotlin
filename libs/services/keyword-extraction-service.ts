import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

import type { KeywordExtractionResult } from '@/libs/types/competitor.types'
import type { MyUIMessage } from '@/schema/chat'

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

const KEYWORD_EXTRACTION_PROMPT = `You are a keyword extraction specialist for competitive product analysis.

CRITICAL TASK: Extract the PRODUCT CONCEPT from user's development intent, NOT the development process itself.

When user says "I want to develop/build/create X", you extract what X IS (the product), not how to develop it.

IMPORTANT RULES:
1. ALL output MUST be in English, regardless of input language
2. Extract the PRODUCT TYPE, not development keywords
3. Focus on what users would search to FIND similar products
4. Remove action verbs: "develop", "build", "create", "make"
5. Add competitive research terms: "app", "software", "tool", "alternative", "comparison"
6. Translate non-English concepts to proper English industry terms

Output format (JSON only):
{
  "primaryKeywords": ["product type keyword", "feature keyword"],
  "searchQuery": "search query to find competitor products",
  "confidence": 0.85
}

EXAMPLES:

Input: "我要开发一个 todo App"
WRONG: "develop todo app tutorial" ❌
CORRECT: {
  "primaryKeywords": ["todo app", "task management", "to-do list software"],
  "searchQuery": "todo app task management software alternatives comparison",
  "confidence": 0.95
}

Input: "I want to build a markdown note-taking app for developers"
WRONG: "build markdown app tutorial" ❌
CORRECT: {
  "primaryKeywords": ["markdown editor", "developer notes", "code documentation"],
  "searchQuery": "markdown note-taking app for developers alternatives",
  "confidence": 0.9
}

Input: "我想做一个在线协作白板工具"
WRONG: "how to make whiteboard tool" ❌
CORRECT: {
  "primaryKeywords": ["online whiteboard", "collaborative canvas", "visual collaboration"],
  "searchQuery": "online collaborative whiteboard software comparison",
  "confidence": 0.9
}

Input: "开发一个支持多人实时编辑的文档应用"
WRONG: "develop real-time document editor" ❌
CORRECT: {
  "primaryKeywords": ["collaborative document editor", "real-time editing", "shared documents"],
  "searchQuery": "collaborative document editing software real-time alternatives",
  "confidence": 0.95
}

User's conversation:
`

export class KeywordExtractionService {
  async extractFromConversation(messages: MyUIMessage[]): Promise<KeywordExtractionResult> {
    // Strategy:
    // 1. Use latest assistant message with <final> tag (finalized requirement doc)
    // 2. If no <final>, use <draft> tag (draft requirement doc)
    // 3. If neither, use first user message

    let extractionText = ''
    let source = 'fallback'

    // Find latest assistant message
    const assistantMessages = messages.filter((m) => m.role === 'assistant')
    if (assistantMessages.length > 0) {
      const latestAssistant = assistantMessages[assistantMessages.length - 1]
      const textPart = latestAssistant.parts.find((p) => p.type === 'text')

      if (textPart && 'text' in textPart) {
        const fullText = textPart.text

        // Try to extract <final> content
        const finalMatch = fullText.match(/<final>([\s\S]*?)<\/final>/)
        if (finalMatch) {
          extractionText = finalMatch[1].trim()
          source = 'final'
          console.log('[KeywordExtractor] Using <final> tag from latest assistant message')
        } else {
          // Try to extract <draft> content
          const draftMatch = fullText.match(/<draft>([\s\S]*?)<\/draft>/)
          if (draftMatch) {
            extractionText = draftMatch[1].trim()
            source = 'draft'
            console.log('[KeywordExtractor] Using <draft> tag from latest assistant message')
          }
        }
      }
    }

    // Fallback to first user message
    if (!extractionText) {
      const userMessages = messages.filter((m) => m.role === 'user')
      if (userMessages.length > 0) {
        const firstMessage = userMessages[0]
        const textPart = firstMessage.parts.find((p) => p.type === 'text' && 'text' in p)
        extractionText = textPart?.['text'] || ''
        source = 'first-user-message'
        console.log('[KeywordExtractor] Using first user message as fallback')
      }
    }

    // Final fallback
    if (!extractionText.trim()) {
      console.log('[KeywordExtractor] No valid content found, using generic fallback')
      return {
        primaryKeywords: ['product features'],
        searchQuery: 'product features comparison',
        confidence: 0.3,
      }
    }

    const limitedText = extractionText.slice(0, 2000)
    console.log(`[KeywordExtractor] Extraction source: ${source}, text length: ${limitedText.length}`)

    try {
      const { text } = await generateText({
        model: openai.chat('gemini-2.5-pro'),
        prompt: KEYWORD_EXTRACTION_PROMPT + limitedText,
        temperature: 0.3,
        maxRetries: 2,
      })

      const cleanedText = text
        .trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
      const parsed = JSON.parse(cleanedText) as {
        primaryKeywords?: string[]
        searchQuery?: string
        confidence?: number
      }

      if (!parsed.primaryKeywords || !Array.isArray(parsed.primaryKeywords) || parsed.primaryKeywords.length === 0) {
        throw new Error('Invalid keywords format')
      }

      const result = {
        primaryKeywords: parsed.primaryKeywords,
        searchQuery: parsed.searchQuery || parsed.primaryKeywords.join(' '),
        confidence: parsed.confidence || 0.7,
      }

      console.log('[KeywordExtractor] Extracted keywords:', result)
      return result
    } catch (error) {
      console.error('[KeywordExtractor] Primary extraction failed, trying simplified extraction:', error)
      return this.simplifiedExtraction(limitedText)
    }
  }

  private async simplifiedExtraction(conversationText: string): Promise<KeywordExtractionResult> {
    try {
      const simplifiedPrompt = `Extract the product type from this text. Return ONLY JSON:
{"productType": "the product in English", "category": "product category in English"}

Rules:
- Remove "develop", "build", "create", "make" etc.
- Translate to English
- Focus on WHAT the product IS, not how to build it

Text: ${conversationText.slice(-500)}

JSON:`

      const { text } = await generateText({
        model: openai.chat('gemini-2.5-pro'),
        prompt: simplifiedPrompt,
        temperature: 0.2,
      })

      const cleanedText = text
        .trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
      const parsed = JSON.parse(cleanedText) as {
        productType?: string
        category?: string
      }

      if (!parsed.productType) {
        throw new Error('No product type extracted')
      }

      const productType = parsed.productType.toLowerCase()
      const category = parsed.category?.toLowerCase() || ''

      const result = {
        primaryKeywords: [productType, category].filter(Boolean),
        searchQuery: `${productType} ${category} software alternatives comparison`.trim(),
        confidence: 0.6,
      }

      console.log('[KeywordExtractor] Simplified extraction result:', result)
      return result
    } catch (error) {
      console.error('[KeywordExtractor] All extraction attempts failed:', error)

      return {
        primaryKeywords: ['software', 'application'],
        searchQuery: 'software product alternatives comparison',
        confidence: 0.2,
      }
    }
  }
}
