'use client'

import { ChatStatus } from 'ai'
import { ArrowUp, Square } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  onSendMessage: (message: { text: string }) => void
  onStop: () => void
  status: ChatStatus
  disabled?: boolean
}

export function ChatInput({ onSendMessage, onStop, status, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status === 'submitted' || status === 'streaming' || disabled) return

    onSendMessage({ text: input })
    setInput('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleStop = () => {
    onStop()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
    <div className="px-4 mb-2">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
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
              disabled={status !== 'streaming' && !input.trim()}
              size="sm"
              className="absolute right-2 bottom-2 h-8 w-8 p-0">
              {status === 'streaming' ? <Square className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
          <p className="text-xs text-muted-foreground">Powered by Gemini-2.5-flash</p>
        </div>
      </form>
    </div>
  )
}
