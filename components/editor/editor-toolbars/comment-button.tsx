'use client'

import { useBlockNoteEditor, useComponentsContext } from '@blocknote/react'
import { toast } from 'sonner'

export function CommentButton() {
  const editor = useBlockNoteEditor()
  const Components = useComponentsContext()!

  const handleAddCommentInSidebar = () => {
    const selection = editor.getSelection()
    if (!selection) {
      toast.error('Please select some text to comment on')
      return
    }

    // 获取选中的块ID
    const selectedBlock = selection.blocks[0]
    if (!selectedBlock) {
      toast.error('Please select some text to comment on')
      return
    }

    // 打开侧边栏并创建新评论
    if (typeof window !== 'undefined' && (window as any).createNewComment) {
      ;(window as any).createNewComment(selectedBlock.id)
    }

    // 强制展开评论侧边栏
    if (typeof window !== 'undefined' && (window as any).expandCommentSidebar) {
      ;(window as any).expandCommentSidebar()
    }
  }

  return (
    <Components.FormattingToolbar.Button mainTooltip="Add Comment" onClick={handleAddCommentInSidebar}>
      💬
    </Components.FormattingToolbar.Button>
  )
}
