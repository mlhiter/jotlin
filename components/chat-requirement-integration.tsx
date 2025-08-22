'use client'

import { FileText, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { RequirementGenerator } from '@/components/requirement-generator'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ChatRequirementIntegrationProps {
  chatMessage?: string // Optional: pre-fill with current chat message
  onDocumentCreated?: (documentId: string) => void
}

export function ChatRequirementIntegration({ chatMessage, onDocumentCreated }: ChatRequirementIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          生成需求文档
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI需求文档生成
          </DialogTitle>
          <DialogDescription>使用AI多agent系统分析需求并生成专业的需求文档</DialogDescription>
        </DialogHeader>
        <RequirementGenerator
          onDocumentCreated={(docId) => {
            onDocumentCreated?.(docId)
            setIsOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
