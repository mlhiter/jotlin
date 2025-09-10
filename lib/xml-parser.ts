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

export const parseAIResponse = (text: string): ParsedResponse => {
  const result: ParsedResponse = {
    options: [],
    rawText: text,
  }

  const proseMatches = text.matchAll(/<prose>([\s\S]*?)<\/prose>/g)
  const proseArray: string[] = []
  for (const match of proseMatches) {
    proseArray.push(match[1].trim())
  }
  if (proseArray.length > 0) {
    result.prose = proseArray
  }

  const questionMatch = text.match(/<question>([\s\S]*?)<\/question>/)
  if (questionMatch) {
    result.question = questionMatch[1].trim()
  }

  const optionsMatch = text.match(/<options(?:\s+type="(single|multiple)")?>([\s\S]*?)<\/options>/)
  if (optionsMatch) {
    result.optionType = (optionsMatch[1] as OptionType) || 'single'
    const optionsText = optionsMatch[2]
    const optionMatches = optionsText.matchAll(/<option value="([^"]*)">([\s\S]*?)<\/option>/g)

    for (const match of optionMatches) {
      result.options.push({
        value: match[1],
        text: match[2].trim(),
      })
    }
  }

  const draftMatch = text.match(/<draft>([\s\S]*?)<\/draft>/)
  if (draftMatch) {
    result.draft = draftMatch[1].trim()
  }

  const finalMatch = text.match(/<final>([\s\S]*?)<\/final>/)
  if (finalMatch) {
    result.final = finalMatch[1].trim()
  }

  const inputMatch = text.match(/<input\s+type="([^"]*)"(?:\s+placeholder="([^"]*)")?\s*\/>/)
  if (inputMatch) {
    result.input = {
      type: inputMatch[1],
      placeholder: inputMatch[2] || '',
    }
  }
  console.log('result', result)
  return result
}
