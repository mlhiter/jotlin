'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { useAuth } from '@/hooks/use-auth'
import apiClient from '@/libs/utils/axios'

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FeedbackFormData {
  type: string
  title: string
  content: string
  email: string
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { user } = useAuth()

  const getFeedbackTypes = () =>
    [
      { value: 'BUG_REPORT', label: 'Bug Report', icon: '🐛' },
      { value: 'FEATURE_REQUEST', label: 'Feature Request', icon: '💡' },
      { value: 'GENERAL', label: 'General Feedback', icon: '💬' },
      { value: 'COMPLAINT', label: 'Complaint', icon: '😞' },
      { value: 'COMPLIMENT', label: 'Compliment', icon: '👍' },
    ] as const

  const [formData, setFormData] = useState<FeedbackFormData>({
    type: 'GENERAL',
    title: '',
    content: '',
    email: user?.email || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      type: 'GENERAL',
      title: '',
      content: '',
      email: user?.email || '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await apiClient.post('/api/feedback', {
        ...formData,
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
      })

      if (response.status === 200) {
        toast.success('Thank you for your feedback!')
        resetForm()
        onOpenChange(false)
      } else {
        toast.error('Failed to submit feedback. Please try again.')
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>We Value Your Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by sharing your thoughts, reporting bugs, or suggesting new features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type */}
          <div>
            <label className="text-sm font-medium">Feedback Type</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {getFeedbackTypes().map((type) => (
                <Badge
                  key={type.value}
                  variant={formData.type === type.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFormData({ ...formData, type: type.value })}>
                  {type.icon} {type.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="feedback-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="feedback-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief summary of your feedback"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="feedback-content" className="text-sm font-medium">
              Details
            </label>
            <Textarea
              id="feedback-content"
              className="max-h-50 resize-none"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Please provide detailed information..."
              rows={4}
              required
            />
          </div>

          {/* Email (for anonymous users) */}
          {!user && (
            <div>
              <label htmlFor="feedback-email" className="text-sm font-medium">
                Email (Optional)
              </label>
              <Input
                id="feedback-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
