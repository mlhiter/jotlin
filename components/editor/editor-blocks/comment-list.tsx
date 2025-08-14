'use client'

import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { type BlockNoteEditor } from '@blocknote/core'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage } from '@/components/ui/avatar'

import { useSession } from '@/hooks/use-session'
import { parseMentions, formatMentionsInText } from '@/libs/mention-parser'

interface Comment {
  id: string
  content: string
  blockId: string
  createdAt: string
  updatedAt?: string
  parentId?: string | null
  isAIReply?: boolean
  user: {
    name: string
    image: string
    email: string
  }
  replies?: Comment[]
}

interface CommentListProps {
  editor: BlockNoteEditor<any, any>
  refreshTrigger?: number
}

export function CommentList({ editor, refreshTrigger }: CommentListProps) {
  const params = useParams()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const { user: currentUser } = useSession()

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

  const handleSubmitReply = async (parentId: string, blockId: string) => {
    if (!replyContent.trim()) return

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: params.documentId,
          content: replyContent,
          blockId,
          parentId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create reply')
      }

      const newReply = await response.json()

      // 刷新评论列表
      handleCancelReply()
      // 触发评论刷新
      if ((window as any).refreshComments) {
        ;(window as any).refreshComments()
      }
      toast.success('Reply posted')
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error('Failed to post reply')
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

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                content: editContent,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      )

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

      setComments((prev) => prev.filter((c) => c.id !== commentId))

      const remainingComments = comments.filter(
        (c) => c.blockId === blockId && c.id !== commentId
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

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(
          `/api/comments?documentId=${params.documentId}`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch comments')
        }
        const data = await response.json()
        setComments(data)
      } catch (error) {
        console.error('Error fetching comments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.documentId) {
      fetchComments()
    }
  }, [params.documentId, refreshTrigger])

  if (isLoading) {
    return <div className="p-4">Loading comments...</div>
  }

  const CommentItem = ({
    comment,
    depth = 0,
  }: {
    comment: Comment
    depth?: number
  }) => {
    const isAI = comment.user.email === 'ai@jotlin.com' || comment.isAIReply

    return (
      <div className={`${depth > 0 ? 'ml-8 mt-3' : ''}`}>
        <div className="flex max-w-full items-start gap-3">
          <Avatar
            className={`h-8 w-8 flex-shrink-0 ${isAI ? 'ring-2 ring-blue-500' : ''}`}>
            <AvatarImage
              src={comment.user.image || (isAI ? '/logo.svg' : '')}
              alt={comment.user.name}
            />
          </Avatar>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {comment.user.name}
                {isAI && (
                  <span className="ml-1 text-xs text-blue-500">[AI]</span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            {editingId === comment.id ? (
              <div className="mt-1">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="mb-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSaveEdit(comment.id)
                    } else if (e.key === 'Escape') {
                      handleCancelEdit()
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveEdit(comment.id)}
                    className="text-xs">
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className={`overflow-wrap-anywhere mt-1 break-words text-sm ${isAI ? 'rounded bg-blue-50 p-2 dark:bg-blue-950' : ''}`}
                  dangerouslySetInnerHTML={{
                    __html: formatMentionsInText(
                      comment.content,
                      parseMentions(comment.content)
                    ),
                  }}
                />
                {comment.updatedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    (Edited at{' '}
                    {formatDistanceToNow(new Date(comment.updatedAt), {
                      addSuffix: true,
                    })}
                    )
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleScrollToComment(comment.blockId)}
                    className="text-xs">
                    Jump to comment position
                  </Button>
                  {!isAI && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartReply(comment.id)}
                      className="text-xs">
                      Reply
                    </Button>
                  )}
                  {currentUser?.email === comment.user.email && !isAI && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(comment)}
                        className="text-xs">
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteComment(comment.id, comment.blockId)
                        }
                        className="text-xs text-red-500 hover:text-red-600">
                        Delete
                      </Button>
                    </>
                  )}
                </div>

                {/* 回复输入框 */}
                {replyingTo === comment.id && (
                  <div className="mt-3 w-full">
                    <Input
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="mb-2 w-full"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmitReply(comment.id, comment.blockId)
                        } else if (e.key === 'Escape') {
                          handleCancelReply()
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleSubmitReply(comment.id, comment.blockId)
                        }
                        className="text-xs">
                        Post Reply
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelReply}
                        className="text-xs">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 渲染回复 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (comments.length === 0) {
    return <div className="p-4 text-muted-foreground">No comments yet</div>
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)] w-full">
      <div className="w-full space-y-4 p-4">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </ScrollArea>
  )
}
