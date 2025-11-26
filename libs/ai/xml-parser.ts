import dedent from 'dedent'

export interface ParsedResponse {
  prose?: string[]
  question?: string
  options: { value: string; text: string }[]
  optionType?: OptionType
  draft?: string
  final?: string
  input?: { type: string; placeholder: string }
  rawText: string
}
export type OptionType = 'single' | 'multiple'

/**
 * Remove common leading indentation from all lines while preserving relative indentation.
 * This is specifically for markdown content where we need to preserve list indentation.
 */
function preserveMarkdownIndent(text: string): string {
  const lines = text.split('\n')

  // Find minimum indentation (excluding empty lines)
  let minIndent = Infinity
  for (const line of lines) {
    if (line.trim().length === 0) continue
    const indent = line.match(/^(\s*)/)?.[1].length || 0
    if (indent < minIndent) {
      minIndent = indent
    }
  }

  // If no non-empty lines or no common indent, just trim
  if (minIndent === Infinity || minIndent === 0) {
    return text.trim()
  }

  // Remove common indentation from all lines
  const dedented = lines
    .map((line) => {
      if (line.trim().length === 0) return ''
      return line.slice(minIndent)
    })
    .join('\n')
    .trim()

  return dedented
}

export const parseAIResponse = (text: string): ParsedResponse => {
  const result: ParsedResponse = {
    options: [],
    rawText: text,
  }

  // First, try to extract content from <response> wrapper if it exists
  // This handles cases where AI wraps everything in <response>...</response>
  const responseMatch = text.match(/<response>([\s\S]*?)<\/response>/)
  const contentToProcess = responseMatch ? responseMatch[1] : text

  const proseMatches = contentToProcess.matchAll(/<prose>([\s\S]*?)<\/prose>/g)
  const proseArray: string[] = []
  for (const match of proseMatches) {
    proseArray.push(dedent(match[1]))
  }
  if (proseArray.length > 0) {
    result.prose = proseArray
  }

  const questionMatch = contentToProcess.match(/<question>([\s\S]*?)<\/question>/)
  if (questionMatch) {
    result.question = dedent(questionMatch[1])
  }

  const optionsMatch = contentToProcess.match(/<options(?:\s+type="(single|multiple)")?>([\s\S]*?)<\/options>/)
  if (optionsMatch) {
    result.optionType = (optionsMatch[1] as OptionType) || 'single'
    const optionsText = optionsMatch[2]
    const optionMatches = optionsText.matchAll(/<option value="([^"]*)">([\s\S]*?)<\/option>/g)

    for (const match of optionMatches) {
      result.options.push({
        value: match[1],
        text: dedent(match[2]),
      })
    }
  }

  // Try to find draft in both the processed content and original text for robustness
  // Support both complete tags and incomplete tags (for streaming)
  let draftMatch = contentToProcess.match(/<draft>([\s\S]*?)<\/draft>/) || text.match(/<draft>([\s\S]*?)<\/draft>/)
  if (!draftMatch) {
    // Try to match incomplete draft tag (streaming case)
    draftMatch = contentToProcess.match(/<draft>([\s\S]*)$/) || text.match(/<draft>([\s\S]*)$/)
  }
  if (draftMatch) {
    // Use custom function to preserve markdown list indentation
    result.draft = preserveMarkdownIndent(draftMatch[1])
  }

  // Try to find final in both the processed content and original text for robustness
  // Support both complete tags and incomplete tags (for streaming)
  let finalMatch = contentToProcess.match(/<final>([\s\S]*?)<\/final>/) || text.match(/<final>([\s\S]*?)<\/final>/)
  if (!finalMatch) {
    // Try to match incomplete final tag (streaming case)
    finalMatch = contentToProcess.match(/<final>([\s\S]*)$/) || text.match(/<final>([\s\S]*)$/)
  }
  if (finalMatch) {
    // Use custom function to preserve markdown list indentation
    result.final = preserveMarkdownIndent(finalMatch[1])
  }

  const inputMatch = contentToProcess.match(/<input\s+type="([^"]*)"(?:\s+placeholder="([^"]*)")?\s*\/>/)
  if (inputMatch) {
    result.input = {
      type: inputMatch[1],
      placeholder: inputMatch[2] || '',
    }
  }
  return result
}
