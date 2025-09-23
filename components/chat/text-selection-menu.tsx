'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

interface TextSelectionMenuProps {
  onQuote?: (selectedText: string) => void
}

export function TextSelectionMenu({ onQuote }: TextSelectionMenuProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        setIsVisible(false)
        return
      }

      const range = selection.getRangeAt(0)
      const text = selection.toString().trim()

      if (text.length === 0) {
        setIsVisible(false)
        return
      }

      // Check if selection is within our component's container
      const container = document.querySelector('[data-selection-container]')
      if (!container || !container.contains(range.commonAncestorContainer)) {
        setIsVisible(false)
        return
      }

      setSelectedText(text)

      // Get selection bounds
      const rect = range.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      // Calculate menu position
      let x = rect.left + rect.width / 2 - containerRect.left
      let y = rect.top - containerRect.top - 10

      // Ensure menu doesn't go outside container bounds
      const menuWidth = 100 // Approximate menu width (increased for Q shortcut)
      const menuHeight = 40 // Approximate menu height
      const headerHeight = 50 // Header height to avoid overlap

      // Adjust horizontal position if needed
      if (x - menuWidth / 2 < 0) {
        x = menuWidth / 2
      } else if (x + menuWidth / 2 > containerRect.width) {
        x = containerRect.width - menuWidth / 2
      }

      // If there's not enough space above or would overlap with header, position below
      if (y < headerHeight || y - menuHeight < 0) {
        y = rect.bottom - containerRect.top + 10
      }

      setPosition({ x, y })

      setIsVisible(true)
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
        }
        setIsVisible(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isVisible && (event.key === 'q' || event.key === 'Q')) {
        event.preventDefault()
        handleQuote()
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, selectedText])

  const handleQuote = () => {
    if (onQuote && selectedText) {
      onQuote(selectedText)
    }
    setIsVisible(false)

    // Clear selection
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
    }
  }

  if (!isVisible) return null

  return (
    <div
      ref={menuRef}
      className={cn(
        'absolute z-50 flex items-center gap-1 rounded-md border border-border bg-popover p-1 shadow-lg',
        'animate-in duration-200 fade-in-0 zoom-in-95',
        'backdrop-blur-sm'
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%) translateY(-100%)',
      }}>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleQuote}
        className="flex h-7 items-center gap-1 px-2 text-sm text-muted-foreground hover:bg-accent">
        Quote
        <kbd className="ml-1 h-4 w-4 rounded border border-border bg-muted font-mono text-xs">Q</kbd>
      </Button>
    </div>
  )
}
