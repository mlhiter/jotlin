'use client'

import { Check } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Markdown } from '@/components/chat/markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useSelectedOptions } from '@/hooks/use-selected-options'
import { parseAIResponse, ParsedResponse } from '@/lib/xml-parser'
import { MyUIMessage } from '@/schema/chat'

interface AssistantMessageProps {
  content: string
  metadata?: MyUIMessage['metadata']
  onOptionSelect: (value: string, text: string) => void
  onUpdateMetadata?: (metadata: MyUIMessage['metadata']) => void
}

export function AssistantMessage({ content, metadata, onOptionSelect, onUpdateMetadata }: AssistantMessageProps) {
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

      if (currentSelectedStr !== syncedSelectedStr) {
        setSelectedOptions(syncedSelectedOptions)
      }
    }
  }, [globalSelectedOptions, parsed.optionType])

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

      toggleOption({ value, text })
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

  return (
    <div className="space-y-4">
      {/* Prose */}
      {parsed.prose && parsed.prose.length > 0 && (
        <div className="text-sm text-muted-foreground space-y-2">
          {parsed.prose.map((prose, index) => (
            <Markdown key={index} content={prose} />
          ))}
        </div>
      )}

      {/* Question */}
      {parsed.question && (
        <div className="font-medium text-sm">
          <Markdown content={parsed.question} />
        </div>
      )}

      {/* Options */}
      {parsed.options.length > 0 && (
        <div className="space-y-2">
          {parsed.optionType === 'multiple' && (
            <div className="text-xs text-muted-foreground mb-2">
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
                  className={`text-left justify-start h-auto py-3 px-4 whitespace-pre-wrap ${
                    isSelected && 'bg-accent'
                  }`}
                  disabled={answered}
                  onClick={() => {
                    handleOptionClick(option.value, option.text)
                  }}>
                  <span className="font-medium text-xs text-muted-foreground mr-2">{option.value}.</span>
                  <Markdown content={option.text} inline />
                  <div className="w-4 h-4 flex items-center justify-center">
                    {isSelected && <Check className="w-4 h-4" />}
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
      {answered && (
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
          Answered
        </div>
      )}
      {/* If there are no special tags, display the original content */}
      {(!parsed.prose || parsed.prose.length === 0) &&
        !parsed.question &&
        parsed.options.length === 0 &&
        !parsed.draft &&
        !parsed.final &&
        !parsed.input && <Markdown content={parsed.rawText} className="text-sm" />}
    </div>
  )
}
