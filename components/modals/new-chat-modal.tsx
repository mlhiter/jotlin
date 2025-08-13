'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { chatApi } from '@/api/chat'

interface NewChatModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewChatModal({ isOpen, onClose }: NewChatModalProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [requirement, setRequirement] = useState('')
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)

  const createMutation = useMutation({
    mutationFn: chatApi.create,
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      onClose()
      setRequirement('')
      router.push(`/chats/${newChat.id}`)
    },
    onError: () => {
      toast.error('Failed to create chat')
    },
  })

  const handleCreate = async () => {
    if (!requirement.trim()) {
      toast.error('Please enter your requirement')
      return
    }

    try {
      setIsGeneratingTitle(true)

      // Generate title based on user requirement
      let title = 'New Chat'
      try {
        const titleResponse = await chatApi.generateTitle(requirement.trim())
        title = titleResponse.title
      } catch (error) {
        console.error('Failed to generate title:', error)
        // Continue with fallback title
      }

      // Create chat with generated title
      createMutation.mutate({
        title,
        description: requirement.trim(),
      })
    } catch (error) {
      console.error('Error creating chat:', error)
      toast.error('Failed to create chat')
    } finally {
      setIsGeneratingTitle(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleCreate()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start a New Chat</DialogTitle>
          <DialogDescription>
            Describe what you'd like to work on or discuss. We'll automatically
            generate a title based on your needs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="requirement">Your Requirement</Label>
            <Textarea
              id="requirement"
              placeholder="e.g., I need help creating a marketing plan for my new app, or I want to write a technical documentation for my API..."
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] resize-none"
              disabled={createMutation.isPending || isGeneratingTitle}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending || isGeneratingTitle}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !requirement.trim() ||
                createMutation.isPending ||
                isGeneratingTitle
              }>
              {createMutation.isPending || isGeneratingTitle ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isGeneratingTitle ? 'Generating title...' : 'Creating...'}
                </>
              ) : (
                'Create Chat'
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Tip: Press Cmd/Ctrl + Enter to create quickly
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
