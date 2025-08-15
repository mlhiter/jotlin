'use client'

import { toast } from 'sonner'
import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { type BlockNoteEditor } from '@blocknote/core'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useSession } from '@/hooks/use-session'
import { parseMentions, formatMentionsInText } from '@/libs/mention-parser'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'

interface Comment {
  id: string
  content: string
  blockId: string
  createdAt: string
  updatedAt?: string
  replyToCommentId?: string | null
  replyOrder: number
  isAIReply?: boolean
  user: {
    name: string
    image: string
    email: string
  }
  replyToComment?: {
    id: string
    user: {
      name: string
      image: string
      email: string
    }
  } | null
}

interface PositionedCommentListProps {
  editor: BlockNoteEditor<any, any>
  refreshTrigger?: number
  onCommentsChange?: (hasComments: boolean) => void
  newCommentBlockId?: string | null
  onNewCommentCreated?: () => void
}

interface CommentItemProps {
  comment: Comment
  currentUser: any
  editingId: string | null
  editContent: string
  replyingTo: string | null
  replyContent: string
  onStartEdit: (comment: Comment) => void
  onCancelEdit: () => void
  onSaveEdit: (commentId: string) => void
  onDeleteComment: (commentId: string, blockId: string) => void
  onStartReply: (commentId: string) => void
  onCancelReply: () => void
  onSubmitReply: (replyToCommentId: string, blockId: string) => void
  onEditContentChange: (content: string) => void
  onReplyContentChange: (content: string) => void
  onScrollToComment: (blockId: string) => void
  editor: BlockNoteEditor<any, any>
  style?: React.CSSProperties
}

// 获取块内容的辅助函数
const getBlockContent = (
  editor: BlockNoteEditor<any, any>,
  blockId: string
): string => {
  try {
    const block = editor.getBlock(blockId)
    if (block && block.content) {
      // 如果是文本块，获取文本内容
      if (Array.isArray(block.content)) {
        return block.content
          .map((item: any) => item.text || '')
          .join('')
          .trim()
      }
      // 如果是其他类型的块，返回类型信息
      return block.type || ''
    }
    return ''
  } catch (error) {
    console.error('Error getting block content:', error)
    return ''
  }
}

// 计算评论相对于侧边栏的位置
const calculateCommentPosition = (
  blockId: string,
  sidebarContainer: HTMLElement,
  editorContainer: HTMLElement
): number => {
  const blockElement = document.querySelector(
    `[data-id="${blockId}"]`
  ) as HTMLElement
  if (!blockElement) return 0

  const blockRect = blockElement.getBoundingClientRect()
  const editorRect = editorContainer.getBoundingClientRect()

  // 计算块相对于编辑器顶部的位置
  const blockRelativeTop = blockRect.top - editorRect.top

  // 由于侧边栏现在没有滚动，直接返回相对位置
  return Math.max(0, blockRelativeTop)
}

// 处理评论位置重叠
const adjustCommentsPosition = (
  comments: Array<{ blockId: string; position: number; height: number }>,
  minSpacing: number = 15
): Array<{ blockId: string; position: number }> => {
  // 按原始位置排序
  const sortedComments = [...comments].sort((a, b) => a.position - b.position)
  const adjustedComments: Array<{ blockId: string; position: number }> = []

  let lastBottom = 0

  for (const comment of sortedComments) {
    let adjustedPosition = comment.position

    // 如果当前评论的起始位置与上一个评论的结束位置冲突，则调整位置
    if (adjustedPosition < lastBottom + minSpacing) {
      adjustedPosition = lastBottom + minSpacing
    }

    adjustedComments.push({
      blockId: comment.blockId,
      position: adjustedPosition,
    })

    lastBottom = adjustedPosition + comment.height
  }

  return adjustedComments
}

// 单个评论项组件 - 不再包含卡片样式，改为内部评论项
const CommentItem = ({
  comment,
  currentUser,
  editingId,
  editContent,
  replyingTo,
  replyContent,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteComment,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  onEditContentChange,
  onReplyContentChange,
  onScrollToComment,
  editor,
}: Omit<CommentItemProps, 'style'>) => {
  const [isHovered, setIsHovered] = useState(false)

  // 安全检查 comment.user
  if (!comment?.user) {
    console.warn('Comment user is undefined:', comment)
    return null
  }

  const isAI = comment.user.email === 'ai@jotlin.com' || comment.isAIReply

  return (
    <div
      className="group relative p-3 transition-colors hover:bg-muted/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <div className="flex items-start gap-3">
        <Avatar
          className={`h-8 w-8 flex-shrink-0 ${isAI ? 'ring-2 ring-blue-500' : ''}`}>
          <AvatarImage
            src={comment.user.image || (isAI ? '/logo.svg' : '')}
            alt={comment.user.name}
          />
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {/* 显示回复关系 */}
                {comment.user.name}
                {isAI && (
                  <span className="ml-1 text-xs text-blue-500">[AI]</span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {comment.updatedAt &&
                comment.updatedAt !== comment.createdAt ? (
                  <>
                    {formatDistanceToNow(new Date(comment.updatedAt), {
                      addSuffix: true,
                    })}
                    <span className="ml-1">(已编辑)</span>
                  </>
                ) : (
                  formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })
                )}
              </span>
            </div>

            {/* More 菜单 */}
            {currentUser?.email === comment.user.email && !isAI && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 ${isHovered ? 'opacity-100' : ''}`}
                    onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartEdit(comment)
                    }}
                    className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteComment(comment.id, comment.blockId)
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* 评论内容 */}
          {editingId === comment.id ? (
            <div>
              <Input
                value={editContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                className="mb-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onSaveEdit(comment.id)
                  } else if (e.key === 'Escape') {
                    onCancelEdit()
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSaveEdit(comment.id)}
                  className="text-xs">
                  保存
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancelEdit}
                  className="text-xs">
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`cursor-pointer break-words text-sm ${isAI ? 'rounded bg-blue-50 p-2 dark:bg-blue-950' : ''}`}
              onClick={() => onScrollToComment(comment.blockId)}
              dangerouslySetInnerHTML={{
                __html: formatMentionsInText(
                  comment.replyToComment?.user.name
                    ? `@${comment.replyToComment.user.name}: ${comment.content}`
                    : comment.content,
                  parseMentions(comment.content)
                ),
              }}
            />
          )}

          {/* 底部操作区域 */}
          <div className="flex min-h-[24px] items-center justify-between">
            {/* 回复按钮 */}
            {!isAI && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onStartReply(comment.id)
                }}
                className={`text-xs text-muted-foreground transition-opacity hover:text-foreground ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
                回复
              </button>
            )}
          </div>

          {/* 回复输入框 */}
          {replyingTo === comment.id && (
            <div className="mt-2 space-y-2">
              <Input
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                placeholder="写下你的回复..."
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onSubmitReply(comment.id, comment.blockId)
                  } else if (e.key === 'Escape') {
                    onCancelReply()
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSubmitReply(comment.id, comment.blockId)}
                  className="text-xs">
                  发布回复
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancelReply}
                  className="text-xs">
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 评论块组件 - 包含原文和所有相关评论的卡片
interface CommentBlockProps {
  blockId: string
  comments: Comment[]
  blockContent: string
  currentUser: any
  editingId: string | null
  editContent: string
  replyingTo: string | null
  replyContent: string
  onStartEdit: (comment: Comment) => void
  onCancelEdit: () => void
  onSaveEdit: (commentId: string) => void
  onDeleteComment: (commentId: string, blockId: string) => void
  onStartReply: (commentId: string) => void
  onCancelReply: () => void
  onSubmitReply: (replyToCommentId: string, blockId: string) => void
  onEditContentChange: (content: string) => void
  onReplyContentChange: (content: string) => void
  onScrollToComment: (blockId: string) => void
  editor: BlockNoteEditor<any, any>
  style?: React.CSSProperties
}

const CommentBlock = ({
  blockId,
  comments,
  blockContent,
  currentUser,
  editingId,
  editContent,
  replyingTo,
  replyContent,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteComment,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  onEditContentChange,
  onReplyContentChange,
  onScrollToComment,
  editor,
  style,
}: CommentBlockProps) => {
  // 按replyOrder排序评论，确保回复链的顺序正确
  const sortedComments = comments.sort((a, b) => a.replyOrder - b.replyOrder)

  return (
    <div className="rounded-lg border bg-card shadow-sm" style={style}>
      {/* 原文内容 */}
      {blockContent && (
        <div className="border-b border-border p-3">
          <div className="text-xs text-muted-foreground">原文</div>
          <div className="mt-1 truncate text-sm text-foreground">
            {blockContent}
          </div>
        </div>
      )}

      {/* 所有评论 */}
      <div className="divide-y divide-border/50">
        {sortedComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUser={currentUser}
            editingId={editingId}
            editContent={editContent}
            replyingTo={replyingTo}
            replyContent={replyContent}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onSaveEdit={onSaveEdit}
            onDeleteComment={onDeleteComment}
            onStartReply={onStartReply}
            onCancelReply={onCancelReply}
            onSubmitReply={onSubmitReply}
            onEditContentChange={onEditContentChange}
            onReplyContentChange={onReplyContentChange}
            onScrollToComment={onScrollToComment}
            editor={editor}
          />
        ))}
      </div>
    </div>
  )
}

export function PositionedCommentList({
  editor,
  refreshTrigger,
  onCommentsChange,
  newCommentBlockId,
  onNewCommentCreated,
}: PositionedCommentListProps) {
  const params = useParams()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [commentPositions, setCommentPositions] = useState<{
    [commentId: string]: number
  }>({})
  const [newCommentContent, setNewCommentContent] = useState('')
  const [isCreatingComment, setIsCreatingComment] = useState(false)

  const sidebarRef = useRef<HTMLDivElement>(null)
  const { user: currentUser } = useSession()

  // 按blockId分组评论，但保持平级结构 - 使用useMemo避免每次渲染都重新创建
  const commentsByBlock = useMemo(() => {
    const grouped = comments.reduce(
      (acc, comment) => {
        if (!acc[comment.blockId]) {
          acc[comment.blockId] = []
        }
        acc[comment.blockId].push(comment)
        return acc
      },
      {} as { [blockId: string]: Comment[] }
    )

    // 如果有新评论块ID，添加一个空数组
    if (newCommentBlockId && !grouped[newCommentBlockId]) {
      grouped[newCommentBlockId] = []
    }

    return grouped
  }, [comments, newCommentBlockId])

  // 计算评论位置 - 使用useCallback避免每次渲染都重新创建
  const updateCommentPositions = useCallback(() => {
    if (!sidebarRef.current) return

    const editorElement = document.querySelector('.bn-editor') as HTMLElement
    if (!editorElement) return

    const newPositions: { [commentId: string]: number } = {}
    const commentHeights: Array<{
      blockId: string
      position: number
      height: number
    }> = []

    // 获取每个评论组的实际高度
    Object.entries(commentsByBlock).forEach(([blockId, blockComments]) => {
      // 尝试获取实际渲染的评论元素高度
      const existingCommentElement = document.querySelector(
        `[data-comment-block="${blockId}"]`
      ) as HTMLElement
      let actualHeight = 0

      if (existingCommentElement) {
        // 使用实际DOM元素的高度
        actualHeight = existingCommentElement.offsetHeight + 20 // 加一些缓冲空间
      } else {
        // 处理新评论块（没有评论的情况）
        if (blockId === newCommentBlockId && blockComments.length === 0) {
          // 新评论创建界面的估算高度
          actualHeight = 200 // 原文预览 + 输入框 + 按钮 + padding
        } else if (blockComments.length > 0) {
          // 回退到改进的估算方法
          let estimatedHeight = 0

          // 按replyOrder排序评论
          const sortedComments = blockComments.sort(
            (a, b) => a.replyOrder - b.replyOrder
          )

          sortedComments.forEach((comment, index) => {
            // 安全检查评论数据
            if (!comment || !comment.content) {
              console.warn('Invalid comment data:', comment)
              return
            }

            // 基础高度估算
            let singleCommentHeight = 140 // 包含卡片边框、padding等的基础高度

            // 只有第一个评论（根评论）显示原文预览
            if (index === 0 && comment.replyOrder === 0) {
              singleCommentHeight += 60 // 原文预览区域高度
            }

            // 基于内容长度的更准确估算
            const contentLines = Math.ceil(comment.content.length / 40)
            const contentHeight = Math.max(1, contentLines) * 22

            singleCommentHeight += contentHeight

            // 状态相关的高度
            if (editingId === comment.id) {
              singleCommentHeight += 90
            }
            if (replyingTo === comment.id) {
              singleCommentHeight += 110
            }

            estimatedHeight += singleCommentHeight + 8 // 8px间距
          })

          actualHeight = estimatedHeight + 50 // 更大的缓冲空间
        } else {
          // 如果既不是新评论块，也没有评论，跳过
          return
        }
      }

      const position = calculateCommentPosition(
        blockId,
        sidebarRef.current!,
        editorElement
      )
      commentHeights.push({
        blockId,
        position,
        height: actualHeight,
      })

      // 调试信息
      if (process.env.NODE_ENV === 'development') {
        const firstComment = blockComments[0]
        const previewContent =
          firstComment?.content?.substring(0, 30) || 'No content'
        console.log(
          `Comment block ${blockId}: position=${position}, height=${actualHeight}, content="${previewContent}..."`
        )
      }
    })

    // 调整位置避免重叠
    const adjustedPositions = adjustCommentsPosition(commentHeights)

    // 调试信息 - 显示位置调整结果
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'Position adjustments:',
        adjustedPositions.map((p) => `${p.blockId}: ${p.position}`).join(', ')
      )
    }

    // 更新位置映射
    adjustedPositions.forEach(({ blockId, position }) => {
      const blockComments = commentsByBlock[blockId]
      if (blockComments && blockComments.length > 0) {
        newPositions[blockComments[0].id] = position
      } else if (blockId === newCommentBlockId) {
        // 为新评论块设置位置
        newPositions[`new-comment-${blockId}`] = position
      }
    })

    // 只有当位置发生实际变化时才更新状态
    setCommentPositions((prevPositions) => {
      const hasChanges = Object.keys(newPositions).some(
        (commentId) =>
          Math.abs((prevPositions[commentId] || 0) - newPositions[commentId]) >
          1
      )

      if (
        !hasChanges &&
        Object.keys(prevPositions).length === Object.keys(newPositions).length
      ) {
        return prevPositions
      }

      return newPositions
    })
  }, [commentsByBlock, editingId, replyingTo, newCommentBlockId])

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleStartReply = (commentId: string) => {
    setReplyingTo(commentId)
    setReplyContent('')
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setReplyContent('')
  }

  const handleSubmitReply = async (
    replyToCommentId: string,
    blockId: string
  ) => {
    if (!replyContent.trim()) return

    try {
      // 标记正在创建评论
      if (
        typeof window !== 'undefined' &&
        (window as any).setCommentCreationFlag
      ) {
        ;(window as any).setCommentCreationFlag(true)
      }
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: params.documentId,
          content: replyContent,
          blockId,
          replyToCommentId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create reply')
      }

      handleCancelReply()

      // 使用全局函数刷新评论，避免重复的API调用
      if ((window as any).refreshComments) {
        ;(window as any).refreshComments()
      } else {
        // 备用：如果全局函数不存在才直接获取
        await fetchComments()
      }

      // 强制展开评论侧边栏
      if (
        typeof window !== 'undefined' &&
        (window as any).expandCommentSidebar
      ) {
        ;(window as any).expandCommentSidebar()
      }

      toast.success('Reply posted')
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error('Failed to post reply')
    } finally {
      // 评论创建完成，取消标记
      if (
        typeof window !== 'undefined' &&
        (window as any).setCommentCreationFlag
      ) {
        setTimeout(() => {
          ;(window as any).setCommentCreationFlag(false)
        }, 1000) // 给一些缓冲时间
      }
    }
  }

  const handleSaveEdit = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update comment')
      }

      const updateCommentInTree = (comments: Comment[]): Comment[] => {
        return comments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              content: editContent,
              updatedAt: new Date().toISOString(),
            }
          }
          return comment
        })
      }

      setComments((prev) => updateCommentInTree(prev))
      setEditingId(null)
      setEditContent('')
      toast.success('Comment updated')
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId: string, blockId: string) => {
    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      const updatedComments = comments.filter((c) => c.id !== commentId)
      setComments(updatedComments)
      // 通知父组件评论状态变化
      onCommentsChange?.(updatedComments.length > 0)

      const remainingComments = updatedComments.filter(
        (c) => c.blockId === blockId
      )
      if (remainingComments.length === 0) {
        const block = editor.getBlock(blockId)
        if (block) {
          editor.updateBlock(block, {
            props: {
              ...block.props,
              backgroundColor: 'default',
            },
          })
        }
      }

      toast.success('Comment deleted')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const handleScrollToComment = (blockId: string) => {
    const block = editor.getBlock(blockId)
    if (block) {
      editor.setTextCursorPosition(block, 'start')
      const element = document.querySelector(`[data-id="${blockId}"]`)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('highlight-block')
          setTimeout(() => {
            element.classList.remove('highlight-block')
          }, 2000)
        }, 100)
      }
    }
  }

  const handleCreateNewComment = async () => {
    if (!newCommentContent.trim() || !newCommentBlockId) return

    try {
      setIsCreatingComment(true)

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: params.documentId,
          content: newCommentContent,
          blockId: newCommentBlockId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create comment')
      }

      const newComment = await response.json()

      // 立即添加评论到本地状态
      setComments((prev) => [...prev, newComment])

      // 设置块的背景色
      const block = editor.getBlock(newCommentBlockId)
      if (block) {
        editor.updateBlock(block, {
          props: {
            ...block.props,
            backgroundColor: 'commented',
          },
        })
      }

      // 清理状态
      setNewCommentContent('')
      onNewCommentCreated?.()

      // 通知父组件评论状态变化
      onCommentsChange?.(true)

      toast.success('Comment created successfully')
    } catch (error) {
      console.error('Error creating comment:', error)
      toast.error('Failed to create comment')
    } finally {
      setIsCreatingComment(false)
    }
  }

  const handleCancelNewComment = () => {
    setNewCommentContent('')
    onNewCommentCreated?.()
  }

  // 提取fetchComments函数使其可重用
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/comments?documentId=${params.documentId}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      const data = await response.json()
      setComments(data)
      // 通知父组件评论状态变化
      onCommentsChange?.(data.length > 0)
    } catch (error) {
      console.error('Error fetching comments:', error)
      onCommentsChange?.(false)
    } finally {
      setIsLoading(false)
    }
  }, [params.documentId, onCommentsChange])

  useEffect(() => {
    if (params.documentId) {
      fetchComments()
    }
  }, [params.documentId, refreshTrigger, fetchComments])

  // 监听评论内容、编辑和回复状态变化，立即更新位置
  useEffect(() => {
    if (comments.length > 0 || newCommentBlockId) {
      updateCommentPositions()
    }
  }, [
    comments,
    editingId,
    replyingTo,
    newCommentBlockId,
    updateCommentPositions,
  ])

  // 监听滚动和窗口变化，更新评论位置
  useEffect(() => {
    if (comments.length === 0 && !newCommentBlockId) return

    let timeoutId: NodeJS.Timeout

    // 防抖更新函数
    const debouncedUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        updateCommentPositions()
      }, 150)
    }

    // 初始计算位置
    const initialTimeout = setTimeout(() => {
      updateCommentPositions()
    }, 100)

    // 监听事件
    window.addEventListener('scroll', debouncedUpdate, { passive: true })
    window.addEventListener('resize', debouncedUpdate)

    // 监听编辑器内容变化
    let observer: MutationObserver | null = null
    const editorElement = document.querySelector('.bn-editor')
    if (editorElement) {
      observer = new MutationObserver(debouncedUpdate)
      observer.observe(editorElement, {
        childList: true,
        subtree: true,
        attributes: false,
      })
    }

    return () => {
      clearTimeout(initialTimeout)
      clearTimeout(timeoutId)
      window.removeEventListener('scroll', debouncedUpdate)
      window.removeEventListener('resize', debouncedUpdate)
      if (observer) {
        observer.disconnect()
      }
    }
  }, [comments.length, newCommentBlockId, updateCommentPositions])

  if (isLoading) {
    return <div className="p-4">Loading comments...</div>
  }

  if (comments.length === 0 && !newCommentBlockId) {
    return null
  }

  return (
    <div ref={sidebarRef} className="absolute inset-0 p-4">
      {Object.entries(commentsByBlock).map(([blockId, blockComments]) => {
        const blockContent = getBlockContent(editor, blockId)

        // 如果是新评论块且没有评论，显示创建评论的界面
        if (blockId === newCommentBlockId && blockComments.length === 0) {
          // 使用统一的位置管理系统
          const position =
            commentPositions[`new-comment-${blockId}`] ||
            calculateCommentPosition(
              blockId,
              sidebarRef.current!,
              document.querySelector('.bn-editor') as HTMLElement
            )

          return (
            <div
              key={blockId}
              data-comment-block={blockId}
              className="absolute left-4 right-4"
              style={{ top: `${position}px` }}>
              <div className="rounded-lg border bg-background p-4 shadow-sm">
                {/* 原文预览 */}
                <div className="mb-3 rounded bg-muted p-2 text-sm text-muted-foreground">
                  <strong>原文:</strong> {blockContent || '选中的文本块'}
                </div>

                {/* 新评论输入 */}
                <div className="space-y-3">
                  <Input
                    value={newCommentContent}
                    onChange={(e) => setNewCommentContent(e.target.value)}
                    placeholder="写下你的评论..."
                    className="w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleCreateNewComment()
                      } else if (e.key === 'Escape') {
                        handleCancelNewComment()
                      }
                    }}
                    disabled={isCreatingComment}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleCreateNewComment}
                      disabled={isCreatingComment || !newCommentContent.trim()}
                      className="text-xs">
                      {isCreatingComment ? '创建中...' : '发布评论'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelNewComment}
                      disabled={isCreatingComment}
                      className="text-xs">
                      取消
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        // 安全检查：确保有有效的评论
        if (!blockComments || blockComments.length === 0) {
          return null
        }

        // 按replyOrder排序评论，确保回复链的顺序正确
        const sortedComments = blockComments.sort(
          (a, b) => a.replyOrder - b.replyOrder
        )
        const rootComment = sortedComments[0] // 第一个评论用于计算位置

        if (!rootComment || !rootComment.user) {
          console.warn(
            `Skipping invalid comment block ${blockId}:`,
            rootComment
          )
          return null
        }

        const position = commentPositions[rootComment.id] || 0

        return (
          <div
            key={blockId}
            data-comment-block={blockId}
            className="absolute left-4 right-4"
            style={{ top: `${position}px` }}>
            {/* 使用新的CommentBlock组件渲染整个评论块 */}
            <CommentBlock
              blockId={blockId}
              comments={sortedComments}
              blockContent={blockContent}
              currentUser={currentUser}
              editingId={editingId}
              editContent={editContent}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onDeleteComment={handleDeleteComment}
              onStartReply={handleStartReply}
              onCancelReply={handleCancelReply}
              onSubmitReply={handleSubmitReply}
              onEditContentChange={setEditContent}
              onReplyContentChange={setReplyContent}
              onScrollToComment={handleScrollToComment}
              editor={editor}
            />
          </div>
        )
      })}
    </div>
  )
}
