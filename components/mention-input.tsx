'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface Collaborator {
  userEmail: string
}

interface MentionSuggestion {
  type: 'user' | 'ai'
  display: string
  value: string
  email?: string
  avatar?: string
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  collaborators?: Collaborator[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MentionInput({
  value,
  onChange,
  onSubmit,
  collaborators = [],
  placeholder = '写下你的评论...',
  disabled = false,
  className = '',
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // 处理@触发
  const handleInputChange = (newValue: string) => {
    onChange(newValue)

    const cursorPosition = inputRef.current?.selectionStart || 0
    const textBeforeCursor = newValue.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex >= 0) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // 检查@后面是否只有字母、数字、中文，没有空格
      if (/^[\w\u4e00-\u9fa5]*$/.test(textAfterAt)) {
        setMentionStart(lastAtIndex)
        showMentionSuggestions(textAfterAt)
      } else {
        hideSuggestions()
      }
    } else {
      hideSuggestions()
    }
  }

  // 显示@建议
  const showMentionSuggestions = (query: string) => {
    const suggestions: MentionSuggestion[] = []

    // AI助手选项
    if (
      'ai'.includes(query.toLowerCase()) ||
      'AI'.includes(query) ||
      query === ''
    ) {
      suggestions.push({
        type: 'ai',
        display: 'AI助手',
        value: 'AI',
        avatar: '🤖',
      })
    }

    // 用户选项
    collaborators.forEach((collaborator) => {
      const email = collaborator.userEmail
      const username = email.split('@')[0]

      if (
        email.toLowerCase().includes(query.toLowerCase()) ||
        username.toLowerCase().includes(query.toLowerCase())
      ) {
        suggestions.push({
          type: 'user',
          display: email,
          value: username,
          email: email,
        })
      }
    })

    setSuggestions(suggestions)
    setSelectedIndex(0)
    setShowSuggestions(suggestions.length > 0)
  }

  // 隐藏建议
  const hideSuggestions = () => {
    setShowSuggestions(false)
    setSuggestions([])
    setMentionStart(-1)
  }

  // 选择建议
  const selectSuggestion = (suggestion: MentionSuggestion) => {
    if (mentionStart >= 0) {
      const cursorPosition = inputRef.current?.selectionStart || 0
      const beforeMention = value.substring(0, mentionStart)
      const afterCursor = value.substring(cursorPosition)
      const newValue = beforeMention + `@${suggestion.value} ` + afterCursor

      onChange(newValue)
      hideSuggestions()

      // 设置光标位置
      setTimeout(() => {
        const newCursorPos = mentionStart + suggestion.value.length + 2
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
        inputRef.current?.focus()
      }, 0)
    }
  }

  // 键盘事件处理
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex])
        }
        return
      } else if (e.key === 'Escape') {
        hideSuggestions()
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !showSuggestions) {
      e.preventDefault()
      onSubmit()
    }
  }

  // 点击其他地方隐藏建议
  useEffect(() => {
    const handleClickOutside = () => {
      hideSuggestions()
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-20"
      />

      {/* @建议列表 */}
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.value}`}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-100 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => selectSuggestion(suggestion)}>
              {suggestion.type === 'ai' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                  🤖
                </div>
              ) : (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={suggestion.avatar} />
                  <AvatarFallback>
                    {suggestion.display.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {suggestion.type === 'ai' ? 'AI助手' : `@${suggestion.value}`}
                </div>
                {suggestion.email && (
                  <div className="text-xs text-gray-500">
                    {suggestion.email}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
