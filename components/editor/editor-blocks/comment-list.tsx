'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useBlockNoteEditor } from '@blocknote/react'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'

interface Comment {
  id: string
  content: string
  blockId: string
  createdAt: string
  user: {
    name: string
    image: string
  }
}

import { type BlockNoteEditor } from '@blocknote/core'
import { type PartialBlock } from '@blocknote/core'

interface CommentListProps {
  editor: BlockNoteEditor<any, any>
}

export function CommentList({ editor }: CommentListProps) {
  const params = useParams()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const handleScrollToComment = (blockId: string) => {
    const block = editor.getBlock(blockId)
    if (block) {
      editor.setTextCursorPosition(block, 'start')
      // 确保块在视图中
      // 找到包含这个块的元素
      const element = document.querySelector(`[data-id="${blockId}"]`)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // 添加临时高亮效果
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
  }, [params.documentId])

  if (isLoading) {
    return <div className="p-4">Loading comments...</div>
  }

  if (comments.length === 0) {
    return <div className="p-4 text-muted-foreground">No comments yet</div>
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-4 p-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.user.image} alt={comment.user.name} />
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="mt-1 text-sm">{comment.content}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleScrollToComment(comment.blockId)}
                className="mt-2 text-xs">
                跳转到评论位置
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
