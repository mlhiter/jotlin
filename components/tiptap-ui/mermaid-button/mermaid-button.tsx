"use client"

import { forwardRef, useCallback } from "react"

// --- Lib ---
import { parseShortcutKeys } from "@/libs/tiptap-utils"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Tiptap UI ---
import type { UseMermaidConfig } from "@/components/tiptap-ui/mermaid-button"
import {
  MERMAID_SHORTCUT_KEY,
  useMermaid,
} from "@/components/tiptap-ui/mermaid-button"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Badge } from "@/components/tiptap-ui-primitive/badge"

type IconProps = React.SVGProps<SVGSVGElement>
type IconComponent = ({ className, ...props }: IconProps) => React.ReactElement

export interface MermaidButtonProps
  extends Omit<ButtonProps, "type">,
    UseMermaidConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean
  /**
   * Optional custom icon component to render instead of the default.
   */
  icon?: React.MemoExoticComponent<IconComponent> | React.FC<IconProps>
}

export function MermaidShortcutBadge({
  shortcutKeys = MERMAID_SHORTCUT_KEY,
}: {
  shortcutKeys?: string
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>
}

/**
 * Button component for inserting Mermaid diagrams in a Tiptap editor.
 *
 * For custom button implementations, use the `useMermaid` hook instead.
 */
export const MermaidButton = forwardRef<HTMLButtonElement, MermaidButtonProps>(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      onInserted,
      showShortcut = false,
      onClick,
      icon: CustomIcon,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const {
      isVisible,
      canInsert,
      handleMermaid,
      label,
      isActive,
      shortcutKeys,
      Icon,
    } = useMermaid({
      editor,
      hideWhenUnavailable,
      onInserted,
    })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleMermaid()
      },
      [handleMermaid, onClick]
    )

    if (!isVisible) {
      return null
    }

    const RenderIcon = CustomIcon ?? Icon

    return (
      <Button
        type="button"
        data-style="ghost"
        data-active-state={isActive ? "on" : "off"}
        role="button"
        tabIndex={-1}
        disabled={!canInsert}
        data-disabled={!canInsert}
        aria-label={label}
        aria-pressed={isActive}
        tooltip={label}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <RenderIcon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
            {showShortcut && <MermaidShortcutBadge shortcutKeys={shortcutKeys} />}
          </>
        )}
      </Button>
    )
  }
)

MermaidButton.displayName = "MermaidButton"
