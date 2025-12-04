'use client'

import { Check, RotateCcw } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Markdown } from '@/components/chat/markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useSelectedOptions } from '@/hooks/use-selected-options'
import { parseAIResponse, ParsedResponse } from '@/libs/ai/xml-parser'
import { MyUIMessage } from '@/schema/chat'

interface AssistantMessageProps {
  content: string
  messageId: string
  metadata?: MyUIMessage['metadata']
  onRollback: () => void
  onOptionSelect: (value: string, text: string) => void
  onUpdateMetadata?: (metadata: MyUIMessage['metadata']) => void
}

export function AssistantMessage({
  content,
  metadata,
  onOptionSelect,
  onUpdateMetadata,
  messageId,
  onRollback,
}: AssistantMessageProps) {
  const [answered, setAnswered] = useState(metadata?.answered || false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(metadata?.selectedOptions || [])
  const [inputValue, setInputValue] = useState(metadata?.inputValue || '')

  const { toggleOption, selectedOptions: globalSelectedOptions } = useSelectedOptions()
  const parsed: ParsedResponse = parseAIResponse(content)

  useEffect(() => {
    if (parsed.optionType === 'multiple') {
      const currentMessageOptions = parsed.options.map((opt) => opt.value)
      const globalSelectedValues = globalSelectedOptions.map((opt) => opt.value)

      const syncedSelectedOptions = currentMessageOptions.filter((value) => globalSelectedValues.includes(value))

      const currentSelectedStr = selectedOptions.sort().join(',')
      const syncedSelectedStr = syncedSelectedOptions.sort().join(',')

      if (currentSelectedStr !== syncedSelectedStr && !answered) {
        setSelectedOptions(syncedSelectedOptions)
      }
    }
  }, [globalSelectedOptions, parsed.optionType])

  useEffect(() => {
    if (metadata) {
      setAnswered(metadata.answered || false)
      setSelectedOptions(metadata.selectedOptions || [])
      setInputValue(metadata.inputValue || '')
    }
  }, [metadata])

  const handleInputSubmit = () => {
    if (answered) return
    if (inputValue.trim()) {
      onOptionSelect(inputValue.trim(), '') // input value = text
      setInputValue('')
      setAnswered(true)

      onUpdateMetadata?.({
        ...metadata,
        answered: true,
        inputValue: inputValue.trim(),
        answeredAt: new Date().toISOString(),
      })
    }
  }

  const handleOptionClick = (value: string, text: string) => {
    if (answered) return

    if (parsed.optionType === 'multiple') {
      const newSelected = selectedOptions.includes(value)
        ? selectedOptions.filter((opt) => opt !== value)
        : [...selectedOptions, value]

      setSelectedOptions(newSelected)

      toggleOption({ value, text }, messageId)
    } else {
      onOptionSelect(value, text)
      setAnswered(true)
      setSelectedOptions([value])

      onUpdateMetadata?.({
        ...metadata,
        answered: true,
        selectedOptions: [value],
        answeredAt: new Date().toISOString(),
      })
    }
  }

  // Don't render document content in chat messages
  const hasDocumentContent = parsed.productDocument || parsed.flowchart || parsed.sitemap || parsed.wireframe
  if (hasDocumentContent && !parsed.prose && !parsed.question && parsed.options.length === 0) {
    return null
  }

  return (
    <div className="flex max-w-[85%] flex-col items-end">
      <div className="space-y-4 rounded-lg p-2.5">
        {/* Prose */}
        {parsed.prose && parsed.prose.length > 0 && (
          <div className="text-muted-foreground space-y-2 text-sm">
            {parsed.prose.map((prose, index) => (
              <Markdown key={index} content={prose} hideMermaid={true} />
            ))}
          </div>
        )}

        {/* Question */}
        {parsed.question && (
          <div className="text-sm font-medium">
            <Markdown content={parsed.question} hideMermaid={true} />
          </div>
        )}

        {/* Options */}
        {parsed.options.length > 0 && (
          <div className="space-y-2">
            {parsed.optionType === 'multiple' && (
              <div className="text-muted-foreground mb-2 text-xs">
                💡 Select options and they will appear in the input field below.
              </div>
            )}
            <div className="grid gap-2">
              {parsed.options.map((option, index) => {
                const isSelected = selectedOptions.includes(option.value)

                return (
                  <Button
                    key={`${option.value}-${index}`}
                    variant="outline"
                    className={`h-auto justify-start whitespace-pre-wrap border-border/40 px-4 py-3 text-left transition-all duration-150 ${
                      isSelected && 'bg-accent/80'
                    }`}
                    disabled={answered}
                    onClick={() => {
                      handleOptionClick(option.value, option.text)
                    }}>
                    <span className="text-muted-foreground mr-2 text-xs font-medium">{option.value}.</span>
                    <Markdown content={option.text} inline />
                    <div className="flex h-4 w-4 items-center justify-center">
                      {isSelected && <Check className="h-4 w-4" strokeWidth={1.5} />}
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Input */}
        {parsed.input && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type={parsed.input.type}
                placeholder={parsed.input.placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleInputSubmit()
                  }
                }}
                disabled={answered}
                className="flex-1"
              />
              <Button onClick={handleInputSubmit} disabled={!inputValue.trim() || answered} size="sm">
                Submit
              </Button>
            </div>
          </div>
        )}
        {/* If there are no special tags, display the original content */}
        {(!parsed.prose || parsed.prose.length === 0) &&
          !parsed.question &&
          parsed.options.length === 0 &&
          !parsed.draft &&
          !parsed.final &&
          !parsed.productDocument &&
          !parsed.flowchart &&
          !parsed.sitemap &&
          !parsed.wireframe &&
          !parsed.input && <Markdown content={parsed.rawText} className="text-sm" hideMermaid={true} />}
      </div>
      <div className="mt-1 flex w-full items-center justify-between gap-1 px-2.5">
        {answered && (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
            Answered
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRollback()}
          className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          title="Rollback to this message">
          <RotateCcw className="mr-1 h-3.5 w-3.5" strokeWidth={1.5} />
          Rollback
        </Button>
      </div>
    </div>
  )
}
