'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useBlockNoteEditor, useComponentsContext } from '@blocknote/react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MentionInput } from '@/components/mention-input'
import { useSession } from '@/hooks/use-session'

interface Collaborator {
  userEmail: string
}

export function CommentButton() {
  const editor = useBlockNoteEditor()
  const Components = useComponentsContext()!
  const params = useParams()
  const { user } = useSession()

  const [isOpen, setIsOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])

  // 获取文档协作者
  useEffect(() => {
    const fetchCollaborators = async () => {
      if (params.documentId) {
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
      }
    }

    if (isOpen) {
      fetchCollaborators()
    }
  }, [params.documentId, isOpen])

  const handleAddComment = async () => {
    try {
      setIsLoading(true)
      const selection = editor.getSelection()

      if (!selection || !params.documentId || !user) {
        toast.error('Please select some text to comment on')
        return
      }

      const block = selection.blocks[0]

      // Mark block as commented using backgroundColor
      editor.updateBlock(block, {
        props: {
          ...block.props,
          backgroundColor: 'commented',
        },
      })

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: params.documentId,
          content: comment,
          blockId: block.id,
        }),
      })

      if (!response.ok) {
        // If comment creation fails, remove the class
        editor.updateBlock(block, {
          props: {
            ...block.props,
            backgroundColor: 'commented',
          },
        })
        throw new Error('Failed to add comment')
      }

      const result = await response.json()

      toast.success('Comment added successfully')

      // 如果有AI处理结果，显示反馈
      if (result.aiResults && result.aiResults.length > 0) {
        setTimeout(() => {
          result.aiResults.forEach((aiResult: string, index: number) => {
            setTimeout(
              () => {
                toast.info(`AI处理结果: ${aiResult}`)
              },
              (index + 1) * 1000
            )
          })
        }, 500)
      }

      setComment('')
      setIsOpen(false)

      // 刷新评论列表
      if (typeof window !== 'undefined' && (window as any).refreshComments) {
        ;(window as any).refreshComments()
      }

      // 如果有AI修改，延迟重新加载文档
      if (result.aiResults && result.aiResults.length > 0) {
        setTimeout(() => {
          if (typeof window !== 'undefined' && (window as any).reloadDocument) {
            ;(window as any).reloadDocument()
          }
        }, 2000) // 等待AI处理完成后重新加载
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to add comment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Components.FormattingToolbar.Button
        mainTooltip="Add Comment"
        onClick={() => {
          const selection = editor.getSelection()
          if (!selection) {
            toast.error('Please select some text to comment on')
            return
          }
          setIsOpen(true)
        }}>
        💬
      </Components.FormattingToolbar.Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <MentionInput
              value={comment}
              onChange={setComment}
              onSubmit={handleAddComment}
              collaborators={collaborators}
              placeholder="写下你的评论... (输入@可以提及用户或AI助手)"
              disabled={isLoading}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}>
                取消
              </Button>
              <Button
                onClick={handleAddComment}
                disabled={isLoading || !comment.trim()}>
                {isLoading ? '添加中...' : '添加评论'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
