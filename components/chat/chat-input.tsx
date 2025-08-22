'use client'

import { Send, Paperclip } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/libs/utils'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  requirementSubmitted: boolean
  isDisabled: boolean
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export const ChatInput = ({ input, setInput, requirementSubmitted, isDisabled, onSend, onKeyDown }: ChatInputProps) => {
  return (
    <div className="border-t bg-background px-4 py-3">
      <div className="relative flex items-center gap-2 rounded-lg border border-input bg-background p-3 transition-colors focus-within:border-ring">
        {/* 附件按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground">
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* 输入框 */}
        <div className="relative flex-1">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={requirementSubmitted ? '输入您的消息...' : '请先输入需求描述...'}
            className="max-h-[120px] min-h-[40px] resize-none border-0 bg-transparent px-0 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
            disabled={isDisabled}
            rows={1}
          />

          {/* 输入状态指示器 */}
          {isDisabled && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="flex space-x-1">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/60" />
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/60 delay-100" />
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/60 delay-200" />
              </div>
            </div>
          )}
        </div>

        {/* 发送按钮 */}
        <Button
          onClick={onSend}
          size="icon"
          className={cn(
            'h-8 w-8 flex-shrink-0 rounded-md',
            !requirementSubmitted || !input.trim() || isDisabled
              ? 'cursor-not-allowed bg-muted text-muted-foreground'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          disabled={!requirementSubmitted || !input.trim() || isDisabled}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* 快捷提示 */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground/70">
        <div className="flex items-center gap-4">
          <span>按 Enter 发送消息</span>
          <span>Shift + Enter 换行</span>
        </div>
        {input.length > 0 && (
          <span className={cn(input.length > 1000 ? 'text-destructive' : 'text-muted-foreground/70')}>
            {input.length}/2000
          </span>
        )}
      </div>
    </div>
  )
}
