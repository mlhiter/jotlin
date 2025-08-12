/**
 * Content detection and cleaning utilities for handling various content formats
 */

export interface ContentAnalysis {
  type: 'markdown' | 'blocknote' | 'recursive-json' | 'unknown'
  isValid: boolean
  content: string
  confidence: number
  issues?: string[]
}

/**
 * Analyze content and determine its format with confidence scoring
 */
export function analyzeContent(content: string): ContentAnalysis {
  if (!content || typeof content !== 'string') {
    return {
      type: 'unknown',
      isValid: false,
      content: '',
      confidence: 0,
      issues: ['Empty or invalid content'],
    }
  }

  // Check for recursive JSON nesting
  const recursiveResult = detectRecursiveJSON(content)
  if (recursiveResult.detected) {
    return {
      type: 'recursive-json',
      isValid: true,
      content: recursiveResult.cleanedContent || content,
      confidence: recursiveResult.confidence,
      issues: recursiveResult.issues,
    }
  }

  // Check for BlockNote JSON format
  const blockNoteResult = detectBlockNoteJSON(content)
  if (blockNoteResult.detected) {
    return {
      type: 'blocknote',
      isValid: blockNoteResult.isValid,
      content,
      confidence: blockNoteResult.confidence,
      issues: blockNoteResult.issues,
    }
  }

  // Check for markdown format
  const markdownResult = detectMarkdown(content)
  return {
    type: 'markdown',
    isValid: markdownResult.isValid,
    content,
    confidence: markdownResult.confidence,
    issues: markdownResult.issues,
  }
}

/**
 * Detect and fix recursive JSON nesting
 */
function detectRecursiveJSON(content: string): {
  detected: boolean
  cleanedContent?: string
  confidence: number
  issues?: string[]
} {
  try {
    const parsed = JSON.parse(content)

    function extractDeepestValidJSON(
      current: any,
      depth = 0
    ): { content?: any; depth: number } {
      if (depth > 15) {
        return { depth }
      }

      // Check if current level contains nested JSON text
      if (
        Array.isArray(current) &&
        current.length === 1 &&
        current[0]?.type === 'paragraph' &&
        current[0]?.content?.[0]?.text?.startsWith('[')
      ) {
        try {
          const nestedParsed = JSON.parse(current[0].content[0].text)
          // Recursively check deeper
          const deeper = extractDeepestValidJSON(nestedParsed, depth + 1)
          return deeper.content
            ? deeper
            : { content: nestedParsed, depth: depth + 1 }
        } catch {
          return { depth }
        }
      }

      // Check if this is valid BlockNote content
      if (Array.isArray(current) && current.length > 0 && current[0]?.type) {
        return { content: current, depth }
      }

      return { depth }
    }

    const result = extractDeepestValidJSON(parsed)
    if (result.content && result.depth > 0) {
      return {
        detected: true,
        cleanedContent: JSON.stringify(result.content),
        confidence: Math.min(95, 60 + result.depth * 10),
        issues: [`Detected ${result.depth} levels of recursive nesting`],
      }
    }

    return { detected: false, confidence: 0 }
  } catch {
    return { detected: false, confidence: 0 }
  }
}

/**
 * Detect BlockNote JSON format
 */
function detectBlockNoteJSON(content: string): {
  detected: boolean
  isValid: boolean
  confidence: number
  issues?: string[]
} {
  try {
    const parsed = JSON.parse(content)

    if (!Array.isArray(parsed)) {
      return { detected: false, isValid: false, confidence: 0 }
    }

    if (parsed.length === 0) {
      return {
        detected: true,
        isValid: true,
        confidence: 85,
        issues: ['Empty BlockNote document'],
      }
    }

    let validBlocks = 0
    let totalBlocks = parsed.length
    const issues: string[] = []

    for (const block of parsed) {
      if (block?.type && block?.props && block?.content !== undefined) {
        validBlocks++
      } else {
        issues.push(`Invalid block structure: missing required fields`)
      }
    }

    const confidence = (validBlocks / totalBlocks) * 90

    return {
      detected: true,
      isValid: confidence > 70,
      confidence,
      issues: issues.length > 0 ? issues : undefined,
    }
  } catch (error) {
    return { detected: false, isValid: false, confidence: 0 }
  }
}

/**
 * Detect markdown format
 */
function detectMarkdown(content: string): {
  isValid: boolean
  confidence: number
  issues?: string[]
} {
  const markdownPatterns = [
    { pattern: /^#{1,6}\s/, weight: 20, name: 'Headers' },
    { pattern: /```[\s\S]*?```/g, weight: 15, name: 'Code blocks' },
    { pattern: /\*\*[\s\S]*?\*\*/g, weight: 10, name: 'Bold text' },
    { pattern: /\*[\s\S]*?\*/g, weight: 8, name: 'Italic text' },
    { pattern: /^[-*+]\s/gm, weight: 12, name: 'Bullet lists' },
    { pattern: /^\d+\.\s/gm, weight: 12, name: 'Numbered lists' },
    { pattern: /\|.*\|/g, weight: 15, name: 'Tables' },
    { pattern: /^>\s/gm, weight: 10, name: 'Blockquotes' },
    { pattern: /^\d+\.\d+/gm, weight: 8, name: 'Nested numbering' },
    { pattern: /^---+$/gm, weight: 5, name: 'Horizontal rules' },
  ]

  let confidence = 0
  const detectedPatterns: string[] = []

  for (const { pattern, weight, name } of markdownPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      confidence += weight * Math.min(matches.length, 3) // Cap contribution
      detectedPatterns.push(name)
    }
  }

  // Bonus for multiple different patterns
  if (detectedPatterns.length > 2) {
    confidence += 10
  }

  // Penalty for very short content
  if (content.length < 50) {
    confidence *= 0.7
  }

  confidence = Math.min(confidence, 95)

  return {
    isValid: confidence > 30,
    confidence,
    issues:
      detectedPatterns.length === 0
        ? ['No markdown patterns detected']
        : undefined,
  }
}
