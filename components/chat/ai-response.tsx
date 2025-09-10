'use client'

import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Markdown } from '@/components/chat/markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { parseAIResponse, ParsedResponse } from '@/lib/xml-parser'

interface AIResponseProps {
  content: string
  onOptionSelect: (value: string, text: string) => void
}

export function AIResponse({ content, onOptionSelect }: AIResponseProps) {
  const [inputValue, setInputValue] = useState('')
  const [answered, setAnswered] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const parsed: ParsedResponse = parseAIResponse(content)

  const handleInputSubmit = () => {
    if (answered) return
    if (inputValue.trim()) {
      onOptionSelect('user_input', inputValue.trim())
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
                  <Markdown content={option.text} />
                  <div className="w-4 h-4 flex items-center justify-center">
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                </Button>
              )
            })}
          </div>
          {answered && (
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
              Answered
            </div>
          )}
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

      {/* Draft */}
      {parsed.draft && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="h-2 w-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">📋 Requirement Draft</h4>
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
              Real-time Update
            </span>
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300 prose prose-sm max-w-none prose-blue">
            <Markdown content={parsed.draft} />
          </div>
        </div>
      )}

      {/* Final Report */}
      {parsed.final && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 rounded-lg p-4 my-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
              ✅ Final Requirement Analysis Report
            </h4>
          </div>
          <div className="text-sm text-green-700 dark:text-green-300 prose prose-sm max-w-none prose-green">
            <Markdown content={parsed.final} />
          </div>
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
