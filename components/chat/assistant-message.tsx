'use client'

import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Markdown } from '@/components/chat/markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { parseAIResponse, ParsedResponse } from '@/lib/xml-parser'

interface AssistantMessageProps {
  content: string
  onOptionSelect: (value: string, text: string) => void
}

export function AssistantMessage({ content, onOptionSelect }: AssistantMessageProps) {
  const [inputValue, setInputValue] = useState('')
  const [answered, setAnswered] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const parsed: ParsedResponse = parseAIResponse(content)

  const handleInputSubmit = () => {
    if (answered) return
    if (inputValue.trim()) {
      onOptionSelect(inputValue.trim(), '') // input value = text
      setInputValue('')
      setAnswered(true)
    }
  }

  const handleOptionClick = (value: string, text: string) => {
    if (answered) return

    if (parsed.optionType === 'multiple') {
      const newSelected = selectedOptions.includes(value)
        ? selectedOptions.filter((opt) => opt !== value)
        : [...selectedOptions, value]

      setSelectedOptions(newSelected)
    } else {
      onOptionSelect(value, text)
      setAnswered(true)
    }
  }

  const handleMultipleSubmit = () => {
    if (answered || selectedOptions.length === 0) return

    const selectedTexts = selectedOptions
      .map((v) => {
        const option = parsed.options.find((opt) => opt.value === v)
        return option ? option.text : v
      })
      .join('\n')

    onOptionSelect(selectedOptions.join(','), selectedTexts)
    setAnswered(true)
  }

  useEffect(() => {
    // Reset answered state when message content changes
    setAnswered(false)
    setInputValue('')
    setSelectedOptions([])
  }, [content])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && parsed.optionType === 'multiple' && selectedOptions.length > 0 && !answered) {
        e.preventDefault()
        handleMultipleSubmit()
      }
    }

    if (parsed.optionType === 'multiple') {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [parsed.optionType, selectedOptions, answered])

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
              💡 You can select multiple options and press{' '}
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">Enter</kbd> to submit.
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
                  onClick={() => handleOptionClick(option.value, option.text)}>
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
