'use client'

import { Share2, Copy, Check, Lock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import apiClient from '@/libs/utils/axios'

interface PublicButtonProps {
  chatId: string
  isPublic: boolean
  onPublicChange: (isPublic: boolean) => void
}

export function PublicButton({ chatId, isPublic, onPublicChange }: PublicButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const previewUrl = `${window.location.origin}/preview/${chatId}`

  const handleMakePublic = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.patch(`/api/chats/${chatId}`, {
        isPublic: true,
      })

      if (response.status === 200) {
        onPublicChange(true)
        setShowDialog(true)
        toast.success('Chat is now public')
      }
    } catch (error) {
      console.error('Failed to make chat public:', error)
      toast.error('Failed to update chat visibility')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMakePrivate = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.patch(`/api/chats/${chatId}`, {
        isPublic: false,
      })

      if (response.status === 200) {
        onPublicChange(false)
        setShowDialog(false)
        toast.success('Chat is now private')
      }
    } catch (error) {
      console.error('Failed to make chat private:', error)
      toast.error('Failed to update chat visibility')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShareClick = () => {
    if (isPublic) {
      setShowDialog(true)
    } else {
      handleMakePublic()
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast.error('Failed to copy link')
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" disabled={isLoading} onClick={handleShareClick} className="relative gap-2 shadow-none">
        <Share2 className="h-4 w-4" />
        Share
        {isPublic && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-green-500" />}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Chat</DialogTitle>
            <DialogDescription>Anyone with this link can view this chat conversation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input value={previewUrl} readOnly className="flex-1" />
              <Button onClick={handleCopyLink} size="sm" variant="outline" className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">This link allows read-only access to your chat. The viewer cannot send messages or interact with the chat.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleMakePrivate} disabled={isLoading} className="gap-2">
              <Lock className="h-4 w-4" />
              Make Private
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
