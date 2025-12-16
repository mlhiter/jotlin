'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import apiClient from '@/libs/utils/axios'

interface DocumentEditDialogProps {
  document: {
    id: string
    title: string
    documentType: string
    icon: string | null
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BUILT_IN_TYPES = ['PRD', 'PAR', 'User Stories', 'Flows', 'Wireframe', 'Sitemap', 'Custom']

const COMMON_ICONS = ['📄', '📝', '📊', '📈', '📋', '📌', '🗺️', '🎯', '💡', '⚡', '🎨', '🔧']

export function DocumentEditDialog({ document, open, onOpenChange }: DocumentEditDialogProps) {
  const [title, setTitle] = useState(document.title)
  const [documentType, setDocumentType] = useState(document.documentType)
  const [icon, setIcon] = useState(document.icon || '📄')
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: async (data: { title: string; documentType: string; icon: string }) => {
      const response = await apiClient.patch(`/api/documents/${document.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', document.id] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      onOpenChange(false)
    },
  })

  const handleSave = () => {
    updateMutation.mutate({ title, documentType, icon })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUILT_IN_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {COMMON_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`flex h-10 w-10 items-center justify-center rounded-md border text-xl transition-colors ${
                    icon === emoji ? 'border-primary bg-primary/10' : 'border-input hover:bg-accent'
                  }`}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
