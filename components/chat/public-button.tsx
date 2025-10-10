'use client'

import { Globe, Lock, Copy, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

import apiClient from '@/lib/axios'

interface PublicButtonProps {
  chatId: string
  isPublic: boolean
  onPublicChange: (isPublic: boolean) => void
}

export function PublicButton({ chatId, isPublic, onPublicChange }: PublicButtonProps) {
  const t = useTranslations('chat')
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const previewUrl = `${window.location.origin}/preview/${chatId}`

  const handleTogglePublic = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.patch(`/api/chats/${chatId}`, {
        isPublic: !isPublic,
      })

      if (response.status === 200) {
        onPublicChange(!isPublic)
        if (!isPublic) {
          setShowDialog(true)
        }
        toast.success(!isPublic ? t('publicSuccess') : t('privateSuccess'))
      }
    } catch (error) {
      console.error('Failed to toggle public status:', error)
      toast.error(t('publicError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl)
      setCopied(true)
      toast.success(t('linkCopied'))
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast.error(t('copyError'))
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading} className="gap-2 shadow-none">
            {isPublic ? (
              <>
                <Globe className="h-4 w-4" />
                {t('public')}
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                {t('private')}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleTogglePublic} disabled={isLoading}>
            {isPublic ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                {t('makePrivate')}
              </>
            ) : (
              <>
                <Globe className="mr-2 h-4 w-4" />
                {t('makePublic')}
              </>
            )}
          </DropdownMenuItem>
          {isPublic && (
            <DropdownMenuItem onClick={() => setShowDialog(true)}>
              <Copy className="mr-2 h-4 w-4" />
              {t('copyPreviewLink')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('shareChat')}</DialogTitle>
            <DialogDescription>{t('shareChatDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input value={previewUrl} readOnly className="flex-1" />
              <Button onClick={handleCopyLink} size="sm" variant="outline" className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{t('previewLinkNote')}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
