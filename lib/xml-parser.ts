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

export const parseAIResponse = (text: string): ParsedResponse => {
  const result: ParsedResponse = {
    options: [],
    rawText: text,
  }

  const proseMatches = text.matchAll(/<prose>([\s\S]*?)<\/prose>/g)
  const proseArray: string[] = []
  for (const match of proseMatches) {
    proseArray.push(dedent(match[1]))
  }
  if (proseArray.length > 0) {
    result.prose = proseArray
  }

  const questionMatch = text.match(/<question>([\s\S]*?)<\/question>/)
  if (questionMatch) {
    result.question = dedent(questionMatch[1])
  }

  const optionsMatch = text.match(/<options(?:\s+type="(single|multiple)")?>([\s\S]*?)<\/options>/)
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

  const draftMatch = text.match(/<draft>([\s\S]*?)<\/draft>/)
  if (draftMatch) {
    result.draft = dedent(draftMatch[1])
  }

  const finalMatch = text.match(/<final>([\s\S]*?)<\/final>/)
  if (finalMatch) {
    result.final = dedent(finalMatch[1])
  }

  const inputMatch = text.match(/<input\s+type="([^"]*)"(?:\s+placeholder="([^"]*)")?\s*\/>/)
  if (inputMatch) {
    result.input = {
      type: inputMatch[1],
      placeholder: inputMatch[2] || '',
    }
  }
  return result
}
