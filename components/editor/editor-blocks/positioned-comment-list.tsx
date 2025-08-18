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
import { MentionInput } from '@/components/mention-input'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { useRealtimeComments } from '@/hooks/use-realtime-comments'

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
  onHeightChange?: (height: number) => void
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
  collaborators: Array<{
    userEmail: string
    userName: string
    userImage?: string | null
  }>
  style?: React.CSSProperties
  isNewlyAdded?: boolean
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

  // 由于侧边栏现在支持滚动，直接返回相对位置
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
  collaborators,
  isNewlyAdded = false,
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
      className={`group relative p-3 transition-all duration-500 hover:bg-muted/30 ${
        isNewlyAdded
          ? 'border-l-4 border-l-blue-500 bg-blue-50 animate-in slide-in-from-right-5'
          : ''
      }`}
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
              <MentionInput
                value={editContent}
                onChange={onEditContentChange}
                onSubmit={() => onSaveEdit(comment.id)}
                collaborators={collaborators}
                placeholder="编辑评论..."
                className="mb-2"
                multiline={true}
                rows={2}
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
            {/* 回复按钮 - AI评论也可以被回复 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStartReply(comment.id)
              }}
              className={`text-xs text-muted-foreground transition-opacity hover:text-foreground ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}>
              {isAI ? '回复AI' : '回复'}
            </button>
          </div>

          {/* 回复输入框 */}
          {replyingTo === comment.id && (
            <div className="mt-2 space-y-2">
              <MentionInput
                value={replyContent}
                onChange={onReplyContentChange}
                onSubmit={() => onSubmitReply(comment.id, comment.blockId)}
                collaborators={collaborators}
                placeholder="写下你的回复..."
                className="w-full"
                multiline={true}
                rows={2}
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
  collaborators: Array<{
    userEmail: string
    userName: string
    userImage?: string | null
  }>
  style?: React.CSSProperties
  newlyAddedCommentIds: Set<string>
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
  collaborators,
  style,
  newlyAddedCommentIds,
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
            collaborators={collaborators}
            isNewlyAdded={newlyAddedCommentIds.has(comment.id)}
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
  onHeightChange,
}: PositionedCommentListProps) {
  const params = useParams()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [commentPositions, setCommentPositions] = useState<{
    [commentId: string]: number
  }>({})
  const [newCommentContent, setNewCommentContent] = useState('')
  const [isCreatingComment, setIsCreatingComment] = useState(false)
  const [collaborators, setCollaborators] = useState<
    Array<{ userEmail: string; userName: string; userImage?: string | null }>
  >([])

  const sidebarRef = useRef<HTMLDivElement>(null)
  const { user: currentUser } = useSession()

  // 使用ref存储isInitialLoad状态，避免依赖项问题
  const isInitialLoadRef = useRef(true)

  // 追踪最近创建的评论，避免重复通知
  const recentlyCreatedCommentIds = useRef<Set<string>>(new Set())

  // 追踪新添加的评论ID（用于高亮显示）
  const [newlyAddedCommentIds, setNewlyAddedCommentIds] = useState<Set<string>>(
    new Set()
  )

  // 提取fetchComments函数使其可重用
  const fetchComments = useCallback(
    async (forceLoading = false) => {
      try {
        // 只有初始加载或强制加载时才显示loading状态
        if (isInitialLoadRef.current || forceLoading) {
          setIsLoading(true)
        }

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
        if (isInitialLoadRef.current) {
          setIsInitialLoad(false)
          isInitialLoadRef.current = false
        }
      }
    },
    [params.documentId, onCommentsChange] // 移除isInitialLoad依赖
  )

  // 处理检测到新评论的函数
  const handleNewComments = useCallback(
    async (newComments: Comment[]) => {
      if (newComments.length > 0) {
        // 使用ref获取当前评论状态，避免依赖comments
        setComments((currentComments) => {
          const currentCommentIds = new Set(currentComments.map((c) => c.id))

          // 手动触发一次完整的评论获取
          fetchComments(false).then(() => {
            // 获取完成后，对比新旧评论列表找出真正的新评论
            setTimeout(() => {
              setComments((latestComments) => {
                const realNewComments = latestComments.filter(
                  (c) => !currentCommentIds.has(c.id)
                )

                if (realNewComments.length > 0) {
                  // 过滤掉最近由当前用户创建的评论，避免重复通知
                  const commentsToNotify = realNewComments.filter(
                    (c) => !recentlyCreatedCommentIds.current.has(c.id)
                  )

                  const newCommentIds = realNewComments.map((c) => c.id)

                  // 标记新评论ID用于高亮
                  setNewlyAddedCommentIds((prev) => {
                    const newSet = new Set(prev)
                    newCommentIds.forEach((id) => newSet.add(id))
                    return newSet
                  })

                  // 3秒后移除高亮
                  setTimeout(() => {
                    setNewlyAddedCommentIds((prev) => {
                      const newSet = new Set(prev)
                      newCommentIds.forEach((id) => newSet.delete(id))
                      return newSet
                    })
                  }, 3000)

                  // 只为非当前用户创建的评论显示提示
                  if (commentsToNotify.length > 0) {
                    if (commentsToNotify.length === 1) {
                      toast.info(`收到新评论：${commentsToNotify[0].user.name}`)
                    } else {
                      toast.info(`收到 ${commentsToNotify.length} 条新评论`)
                    }
                  }
                }
                return latestComments
              })
            }, 200)
          })

          return currentComments // 返回当前状态不变
        })
      }
    },
    [fetchComments]
  )

  // 实时评论hook
  const { isPolling, triggerCheck, reset } = useRealtimeComments({
    documentId: params.documentId as string,
    enabled: !!params.documentId && !isInitialLoad,
    pollingInterval: 5000, // 5秒轮询一次
    onNewComments: handleNewComments,
  })

  // 按blockId分组评论，然后按照在编辑器中的出现顺序排序 - 使用useMemo避免每次渲染都重新创建
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

    // 按照块在编辑器中的出现顺序对分组进行排序
    const sortedEntries = Object.entries(grouped).sort(
      ([blockIdA], [blockIdB]) => {
        const blockA = document.querySelector(`[data-id="${blockIdA}"]`)
        const blockB = document.querySelector(`[data-id="${blockIdB}"]`)

        if (!blockA || !blockB) return 0

        const rectA = blockA.getBoundingClientRect()
        const rectB = blockB.getBoundingClientRect()

        return rectA.top - rectB.top
      }
    )

    return Object.fromEntries(sortedEntries)
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
    })

    // 调整位置避免重叠
    const adjustedPositions = adjustCommentsPosition(commentHeights)

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

    // 计算所需的总高度
    const maxBottomPosition = commentHeights.reduce((max, comment) => {
      const adjustedComment = adjustedPositions.find(
        (p) => p.blockId === comment.blockId
      )
      const finalPosition = adjustedComment
        ? adjustedComment.position
        : comment.position
      return Math.max(max, finalPosition + comment.height)
    }, 0)

    // 通知父组件所需的高度
    if (onHeightChange && maxBottomPosition > 0) {
      onHeightChange(maxBottomPosition)
    }

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

      const result = await response.json()

      // 记录当前用户创建的评论ID，避免轮询时重复通知
      if (result.comment) {
        recentlyCreatedCommentIds.current.add(result.comment.id)
        // 10秒后清除记录
        setTimeout(() => {
          recentlyCreatedCommentIds.current.delete(result.comment.id)
        }, 10000)
      }

      // 如果有AI处理结果，显示通知
      if (result.aiResults && result.aiResults.length > 0) {
        toast.success(`回复已发布。AI回复：${result.aiResults.join(', ')}`)
      } else {
        toast.success('回复已发布')
      }

      // 处理AI的插入指令
      if (result.insertInstruction) {
        try {
          const instruction = result.insertInstruction

          if (instruction.type === 'add_block') {
            // 使用BlockNote API插入新块
            const newBlock = {
              type: 'paragraph',
              props: {
                textColor: 'default',
                backgroundColor: 'blue',
                textAlignment: 'left',
              },
              content: [
                {
                  type: 'text',
                  text: '🤖 AI回复: ',
                  styles: { bold: true, textColor: 'blue' },
                },
                {
                  type: 'text',
                  text: instruction.content || '',
                  styles: {},
                },
              ],
            }

            if (instruction.insertAtEnd) {
              // 插入到文档末尾
              editor.insertBlocks(
                [newBlock],
                editor.document[editor.document.length - 1],
                'after'
              )
            } else if (instruction.afterBlockId) {
              // 插入到指定块之后
              const targetBlock = editor.getBlock(instruction.afterBlockId)
              if (targetBlock) {
                editor.insertBlocks([newBlock], targetBlock, 'after')
              } else {
                // 如果找不到目标块，插入到末尾
                editor.insertBlocks(
                  [newBlock],
                  editor.document[editor.document.length - 1],
                  'after'
                )
              }
            }

            toast.info('AI已添加回复内容')
          } else if (
            instruction.type === 'modify_block' &&
            instruction.targetBlockId
          ) {
            // 修改指定块的内容
            const targetBlock = editor.getBlock(instruction.targetBlockId)
            if (targetBlock) {
              editor.updateBlock(targetBlock, {
                ...targetBlock,
                content: [
                  {
                    type: 'text',
                    text: instruction.content || '',
                    styles: {},
                  },
                ],
              })
              toast.info('AI已修改指定内容')
            } else {
              toast.error('找不到要修改的内容块')
            }
          } else if (
            instruction.type === 'delete_block' &&
            instruction.targetBlockId
          ) {
            // 删除指定块
            const targetBlock = editor.getBlock(instruction.targetBlockId)
            if (targetBlock) {
              editor.removeBlocks([targetBlock])
              toast.info('AI已删除指定内容')
            } else {
              toast.error('找不到要删除的内容块')
            }
          }
        } catch (error) {
          console.error('Error applying AI instruction:', error)
          toast.error('应用AI操作时出错')
        }
      }

      // 如果文档被修改（modify_content情况），刷新编辑器内容
      if (result.documentModified && result.newContent) {
        try {
          const blocks = JSON.parse(result.newContent)

          // 保存当前块的评论样式状态
          const currentBlocks = editor.document
          const commentedBlockIds = new Set<string>()
          currentBlocks.forEach((block: any) => {
            if (block.props?.backgroundColor === 'commented') {
              commentedBlockIds.add(block.id)
            }
          })

          // 更新文档内容
          editor.replaceBlocks(editor.document, blocks)

          // 恢复评论块的样式
          setTimeout(() => {
            commentedBlockIds.forEach((blockId) => {
              const block = editor.getBlock(blockId)
              if (block) {
                editor.updateBlock(block, {
                  props: {
                    ...block.props,
                    backgroundColor: 'commented',
                  },
                })
              }
            })
          }, 100)

          toast.info('文档已由AI自动更新')
        } catch (error) {
          console.error('Error updating document:', error)
        }
      }

      handleCancelReply()

      // 只刷新一次评论，获取包括AI回复在内的所有新评论
      if ((window as any).refreshComments) {
        ;(window as any).refreshComments()
      } else {
        await fetchComments(false)
      }

      // 强制展开评论侧边栏
      if (
        typeof window !== 'undefined' &&
        (window as any).expandCommentSidebar
      ) {
        ;(window as any).expandCommentSidebar()
      }
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

      const result = await response.json()
      const newComment = result.comment || result

      // 记录当前用户创建的评论ID，避免轮询时重复通知
      recentlyCreatedCommentIds.current.add(newComment.id)
      // 10秒后清除记录，允许后续的编辑/删除操作触发通知
      setTimeout(() => {
        recentlyCreatedCommentIds.current.delete(newComment.id)
      }, 10000)

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

      // 如果有AI处理结果，显示通知
      if (result.aiResults && result.aiResults.length > 0) {
        toast.success(`评论已创建。AI回复：${result.aiResults.join(', ')}`)
      } else {
        toast.success('评论已创建')
      }

      // 处理AI的插入指令
      if (result.insertInstruction) {
        try {
          const instruction = result.insertInstruction

          if (instruction.type === 'add_block') {
            // 使用BlockNote API插入新块
            const newBlock = {
              type: 'paragraph',
              props: {
                textColor: 'default',
                backgroundColor: 'blue',
                textAlignment: 'left',
              },
              content: [
                {
                  type: 'text',
                  text: '🤖 AI回复: ',
                  styles: { bold: true, textColor: 'blue' },
                },
                {
                  type: 'text',
                  text: instruction.content || '',
                  styles: {},
                },
              ],
            }

            if (instruction.insertAtEnd) {
              // 插入到文档末尾
              editor.insertBlocks(
                [newBlock],
                editor.document[editor.document.length - 1],
                'after'
              )
            } else if (instruction.afterBlockId) {
              // 插入到指定块之后
              const targetBlock = editor.getBlock(instruction.afterBlockId)
              if (targetBlock) {
                editor.insertBlocks([newBlock], targetBlock, 'after')
              } else {
                // 如果找不到目标块，插入到末尾
                editor.insertBlocks(
                  [newBlock],
                  editor.document[editor.document.length - 1],
                  'after'
                )
              }
            }

            toast.info('AI已添加回复内容')
          } else if (
            instruction.type === 'modify_block' &&
            instruction.targetBlockId
          ) {
            // 修改指定块的内容
            const targetBlock = editor.getBlock(instruction.targetBlockId)
            if (targetBlock) {
              editor.updateBlock(targetBlock, {
                ...targetBlock,
                content: [
                  {
                    type: 'text',
                    text: instruction.content || '',
                    styles: {},
                  },
                ],
              })
              toast.info('AI已修改指定内容')
            } else {
              toast.error('找不到要修改的内容块')
            }
          } else if (
            instruction.type === 'delete_block' &&
            instruction.targetBlockId
          ) {
            // 删除指定块
            const targetBlock = editor.getBlock(instruction.targetBlockId)
            if (targetBlock) {
              editor.removeBlocks([targetBlock])
              toast.info('AI已删除指定内容')
            } else {
              toast.error('找不到要删除的内容块')
            }
          }
        } catch (error) {
          console.error('Error applying AI instruction:', error)
          toast.error('应用AI操作时出错')
        }
      }

      // 如果文档被修改（modify_content情况），刷新编辑器内容
      if (result.documentModified && result.newContent) {
        try {
          const blocks = JSON.parse(result.newContent)

          // 保存当前块的评论样式状态
          const currentBlocks = editor.document
          const commentedBlockIds = new Set<string>()
          currentBlocks.forEach((block: any) => {
            if (block.props?.backgroundColor === 'commented') {
              commentedBlockIds.add(block.id)
            }
          })

          // 更新文档内容
          editor.replaceBlocks(editor.document, blocks)

          // 恢复评论块的样式
          setTimeout(() => {
            commentedBlockIds.forEach((blockId) => {
              const block = editor.getBlock(blockId)
              if (block) {
                editor.updateBlock(block, {
                  props: {
                    ...block.props,
                    backgroundColor: 'commented',
                  },
                })
              }
            })
          }, 100)

          toast.info('文档已由AI自动更新')
        } catch (error) {
          console.error('Error updating document:', error)
        }
      }

      // 清理状态
      setNewCommentContent('')
      onNewCommentCreated?.()

      // 通知父组件评论状态变化
      onCommentsChange?.(true)

      // 刷新评论列表以显示AI回复，延时确保AI处理完成
      setTimeout(() => {
        if ((window as any).refreshComments) {
          ;(window as any).refreshComments()
        } else {
          fetchComments(false)
        }
      }, 1000)
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

  // 获取文档协作者
  const fetchCollaborators = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/documents/${params.documentId}/collaborators`
      )
      if (response.ok) {
        const data = await response.json()
        setCollaborators(data)
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error)
    }
  }, [params.documentId])

  useEffect(() => {
    if (params.documentId) {
      fetchComments()
      fetchCollaborators()
    }
  }, [params.documentId, refreshTrigger, fetchComments, fetchCollaborators])

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
    <div
      ref={sidebarRef}
      className="relative w-full p-4"
      style={{ minHeight: 'calc(100vh - 2rem)' }}>
      {/* 实时状态指示器 */}
      {!isInitialLoad && (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <div
            className={`h-2 w-2 rounded-full ${isPolling ? 'animate-pulse bg-yellow-500' : 'bg-green-500'}`}
          />
          {isPolling ? '检查新评论中...' : '实时监听中'}
        </div>
      )}
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
              className="absolute left-4 right-4 z-50"
              style={{ top: `${position}px` }}>
              <div className="rounded-lg border bg-background p-4 shadow-sm">
                {/* 原文预览 */}
                <div className="mb-3 rounded bg-muted p-2 text-sm text-muted-foreground">
                  <strong>原文:</strong> {blockContent || '选中的文本块'}
                </div>

                {/* 新评论输入 */}
                <div className="space-y-3">
                  <MentionInput
                    value={newCommentContent}
                    onChange={setNewCommentContent}
                    onSubmit={handleCreateNewComment}
                    collaborators={collaborators}
                    placeholder="写下你的评论..."
                    disabled={isCreatingComment}
                    className="w-full"
                    multiline={true}
                    rows={3}
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
            className="absolute left-4 right-4 z-50"
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
              collaborators={collaborators}
              newlyAddedCommentIds={newlyAddedCommentIds}
            />
          </div>
        )
      })}
    </div>
  )
}
