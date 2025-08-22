'use client'

import { Check, Copy, Globe } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { useDocumentActions } from '@/hooks/use-document-actions'
import { useOrigin } from '@/hooks/use-origin'
import { Doc } from '@/types/document'

interface PublishProps {
  initialData: Doc
}

const Publish = ({ initialData }: PublishProps) => {
  const origin = useOrigin()

  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { updateDocument } = useDocumentActions()

  const url = `${origin}/preview/${initialData.id}`

  const onPublish = async () => {
    setIsSubmitting(true)
    try {
      toast.loading('Publishing...')
      await updateDocument({
        id: initialData.id,
        isPublished: true,
      }).finally(() => setIsSubmitting(false))
      toast.success('Note published')
    } catch (error) {
      toast.error('Failed to publish note.')
    }
  }

  const onUnPublish = async () => {
    setIsSubmitting(true)
    try {
      toast.loading('Unpublishing...')
      await updateDocument({
        id: initialData.id,
        isPublished: false,
      }).finally(() => setIsSubmitting(false))
      toast.success('Note unpublished')
    } catch (error) {
      toast.error('Failed to unpublish note.')
    }
  }
  const onCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost">
          Publish
          {initialData.isPublished && <Globe className="ml-2 h-4 w-4 text-sky-500" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end" alignOffset={8} forceMount>
        {initialData.isPublished ? (
          <div className="space-y-4">
            <div className="flex items-center gap-x-2">
              <Globe className="h-4 w-4 animate-pulse text-sky-500" />
              <p className="text-xs font-medium text-sky-500">This note is live on web.</p>
            </div>
            <div className="flex items-center">
              <input
                type="text"
                value={url}
                className="h-8 flex-1 truncate rounded-l-md border bg-muted px-2 text-xs"
                disabled
              />
              <Button onClick={onCopy} disabled={copied} className="h-8 rounded-l-none">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button size="sm" className="w-full text-sm" disabled={isSubmitting} onClick={onUnPublish}>
              Unpublish
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Globe className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="mb-2 text-sm font-medium">Publish this note</p>
            <span className="text-xs text-muted-foreground">Share your work with others</span>
            <Button disabled={isSubmitting} onClick={onPublish} className="w-full text-sm" size="sm">
              Publish
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default Publish
