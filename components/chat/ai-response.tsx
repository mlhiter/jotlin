'use client'

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
  const parsed: ParsedResponse = parseAIResponse(content)

  const handleInputSubmit = () => {
    if (answered) return
    if (inputValue.trim()) {
      onOptionSelect('user_input', inputValue.trim())
      setInputValue('')
      setAnswered(true)
    }
  }

  useEffect(() => {
    // Reset answered state when message content changes
    setAnswered(false)
    setInputValue('')
  }, [content])

  return (
    <div className="space-y-4">
      {/* Prose */}
      {parsed.prose && (
        <div className="text-sm text-muted-foreground">
          <Markdown content={parsed.prose} />
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
          <div className="grid gap-2">
            {parsed.options.map((option, index) => (
              <Button
                key={`${option.value}-${index}`}
                variant="outline"
                className="text-left justify-start h-auto py-3 px-4 whitespace-pre-wrap"
                disabled={answered}
                onClick={() => {
                  if (answered) return
                  onOptionSelect(option.value, option.text)
                  setAnswered(true)
                }}>
                <span className="font-medium text-xs text-muted-foreground mr-2">{option.value}.</span>
                <Markdown content={option.text} />
              </Button>
            ))}
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
      {!parsed.prose &&
        !parsed.question &&
        parsed.options.length === 0 &&
        !parsed.draft &&
        !parsed.final &&
        !parsed.input && <Markdown content={parsed.rawText} className="text-sm" />}
    </div>
  )
}
