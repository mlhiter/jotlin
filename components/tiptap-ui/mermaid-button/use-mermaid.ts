'use client'

import { type Editor } from '@tiptap/react'
import { useCallback, useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { MermaidIcon } from '@/components/tiptap-icons/mermaid-icon'

import { useIsBreakpoint } from '@/hooks/use-is-breakpoint'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'
import { isExtensionAvailable } from '@/libs/tiptap-utils'

export const MERMAID_SHORTCUT_KEY = 'mod+shift+m'

/**
 * Configuration for the mermaid functionality
 */
export interface UseMermaidConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when insertion is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful mermaid insertion.
   */
  onInserted?: () => void
}

/**
 * Checks if mermaid can be inserted in the current editor state
 */
export function canInsertMermaid(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isExtensionAvailable(editor, 'mermaid')) return false

  return editor.can().insertContent({ type: 'mermaid' })
}

/**
 * Checks if mermaid is currently active
 */
export function isMermaidActive(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  return editor.isActive('mermaid')
}

/**
 * Inserts a mermaid diagram in the editor
 */
export function insertMermaid(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canInsertMermaid(editor)) return false

  try {
    return editor
      .chain()
      .focus()
      .insertContent({
        type: 'mermaid',
        attrs: {
          code: 'flowchart TD\n    A[Start] --> B[End]',
        },
      })
      .run()
  } catch {
    return false
  }
}

/**
 * Determines if the mermaid button should be shown
 */
export function shouldShowButton(props: { editor: Editor | null; hideWhenUnavailable: boolean }): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isExtensionAvailable(editor, 'mermaid')) return false

  if (hideWhenUnavailable && !editor.isActive('code')) {
    return canInsertMermaid(editor)
  }

  return true
}

/**
 * Custom hook that provides mermaid functionality for Tiptap editor
 */
export function useMermaid(config?: UseMermaidConfig) {
  const { editor: providedEditor, hideWhenUnavailable = false, onInserted } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const isMobile = useIsBreakpoint()
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canInsert = canInsertMermaid(editor)
  const isActive = isMermaidActive(editor)

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable }))
    }

    handleSelectionUpdate()

    editor.on('selectionUpdate', handleSelectionUpdate)

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleMermaid = useCallback(() => {
    if (!editor) return false

    const success = insertMermaid(editor)
    if (success) {
      onInserted?.()
    }
    return success
  }, [editor, onInserted])

  useHotkeys(
    MERMAID_SHORTCUT_KEY,
    (event) => {
      event.preventDefault()
      handleMermaid()
    },
    {
      enabled: isVisible && canInsert,
      enableOnContentEditable: !isMobile,
      enableOnFormTags: true,
    }
  )

  return {
    isVisible,
    isActive,
    handleMermaid,
    canInsert,
    label: 'Insert Mermaid diagram',
    shortcutKeys: MERMAID_SHORTCUT_KEY,
    Icon: MermaidIcon,
  }
}
