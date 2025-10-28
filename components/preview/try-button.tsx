'use client'

import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { AuthDialog } from '@/components/auth/auth-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import { useAuth } from '@/hooks/use-auth'
import apiClient from '@/libs/utils/axios'

const PENDING_MESSAGE_KEY = 'jotlin_pending_message'

export function TryButton() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const [showInputDialog, setShowInputDialog] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [input, setInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleTryClick = () => {
    setShowInputDialog(true)
  }

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast.error('Please enter what you want to build')
      return
    }

    if (!isAuthenticated) {
      sessionStorage.setItem(PENDING_MESSAGE_KEY, input)
      setShowInputDialog(false)
      setShowAuthDialog(true)
      return
    }

    await handleCreateChat(input)
  }

  const handleCreateChat = async (message: string) => {
    try {
      setIsCreating(true)
      const response = await apiClient.post('/api/chats', { title: message.slice(0, 50) })
      const chat = response.data
      router.push(`/chat/${chat.id}?message=${encodeURIComponent(message)}`)
    } catch (error) {
      console.error('Failed to create chat:', error)
      toast.error('Failed to create chat')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <Button variant="default" onClick={handleTryClick}>
        <Sparkles className="h-4 w-4" />
        Try It Free
      </Button>

      <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Start Your Project</DialogTitle>
            <DialogDescription>
              Describe what you want to build, and AI will help you bring it to life
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="e.g., I want to create a todo app..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-32"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInputDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isCreating || !input.trim()}>
                {isCreating ? 'Creating...' : 'Start'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} redirectTo="/chat?from=preview" />
    </>
  )
}
