'use client'

import { ChatStatus } from 'ai'
import { ArrowUp, Square, X, TextAlignStart } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { SelectedOption, useSelectedOptions } from '@/hooks/use-selected-options'

interface Quote {
  id: string
  text: string
}

interface ChatInputProps {
  onSendMessage: (message: { text: string }) => void
  onStop: () => void
  status: ChatStatus
  disabled?: boolean
  quotes?: Quote[]
  onAddQuote?: (quote: Quote) => void
  onRemoveQuote?: (id: string) => void
  onMarkMessageAnswered?: (messageId: string, selectedOptions: SelectedOption[]) => void
}

export function ChatInput({
  onSendMessage,
  onStop,
  status,
  disabled = false,
  quotes = [],
  onRemoveQuote,
  onMarkMessageAnswered,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { selectedOptions, clearOptions, removeOption, currentAssistantMessageId } = useSelectedOptions()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && selectedOptions.length === 0) || status === 'submitted' || status === 'streaming' || disabled)
      return

    let messageText = ''

    if (selectedOptions.length > 0) {
      const selectedTexts = selectedOptions.map((option) => option.value).join(',')
      messageText = selectedTexts

      if (currentAssistantMessageId) {
        onMarkMessageAnswered?.(currentAssistantMessageId, selectedOptions)
      }
    }

    if (quotes.length > 0) {
      const quotesText = quotes.map((quote) => `<quote>${quote.text}</quote>`).join('\n')
      messageText = quotesText + (messageText ? '\n\n' + messageText : '') + (input.trim() ? '\n\n' + input : '')
    } else if (input.trim()) {
      messageText = messageText ? messageText + '\n\n' + input : input
    }

    onSendMessage({ text: messageText })
    setInput('')
    clearOptions()

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleStop = () => {
    onStop()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 200
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  return (
    <div className="px-4 mb-2 mt-1 z-50">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        {quotes.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center gap-1 bg-muted/30 rounded px-2 py-1 w-48 border-border border-1">
                <TextAlignStart className="h-3 w-3 text-accent-foreground/70 flex-shrink-0" />
                <div className="flex-1 text-xs text-muted-foreground truncate">{quote.text}</div>
                {onRemoveQuote && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveQuote(quote.id)}
                    className="h-4 w-4 p-0">
                    <X className="h-2 w-2 text-neutral-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedOptions.length > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground">Selected options:</div>
              <div className="flex flex-wrap gap-2">
                {selectedOptions.map((option, index) => (
                  <div
                    key={`${option.value}-${index}`}
                    className="flex items-center gap-2 bg-accent/30 rounded px-2 py-1 text-sm border border-border">
                    <span className="font-medium text-xs text-muted-foreground">{option.value}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeOption(option.value)}
                      className="h-4 w-4 p-0">
                      <X className="h-2 w-2 text-neutral-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearOptions}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
              Clear all
            </Button>
          </div>
        )}

        <div className="relative flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Jotlin Agent..."
              disabled={status === 'submitted' || status === 'streaming' || disabled}
              className="max-h-[200px] resize-none pr-12 py-3"
              rows={1}
            />
            <Button
              type={status === 'streaming' ? 'button' : 'submit'}
              onClick={status === 'streaming' ? handleStop : undefined}
              disabled={status !== 'streaming' && !input.trim() && selectedOptions.length === 0}
              size="sm"
              className="absolute right-2 bottom-2 h-8 w-8 p-0">
              {status === 'streaming' ? <Square className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
          <p className="text-xs text-muted-foreground">Powered by Gemini-2.5-pro</p>
        </div>
      </form>
    </div>
  )
}
