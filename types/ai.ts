export type OptionType = 'single' | 'multiple'

export interface ParsedResponse {
  prose?: string[]
  question?: string
  options: { value: string; text: string }[]
  optionType?: OptionType
  draft?: string
  final?: string
  productDocument?: string
  flowchart?: string
  sitemap?: string
  wireframe?: string
  input?: { type: string; placeholder: string }
  rawText: string
}
