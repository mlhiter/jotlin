'use client'

import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { useSession } from '@/hooks/use-session'

export function CommentButton() {
  const editor = useBlockNoteEditor()
  const Components = useComponentsContext()!
  const params = useParams()
  const { user } = useSession()

  const [isOpen, setIsOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAddComment = async () => {
    try {
      setIsLoading(true)
      const selection = editor.getSelection()

      if (!selection || !params.documentId || !user) {
        toast.error('Please select some text to comment on')
        return
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: params.documentId,
          content: comment,
          blockId: selection.blocks[0].id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      toast.success('Comment added successfully')
      setComment('')
      setIsOpen(false)
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
            <Input
              placeholder="Write your comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddComment()
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleAddComment}
                disabled={isLoading || !comment.trim()}>
                {isLoading ? 'Adding...' : 'Add Comment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
