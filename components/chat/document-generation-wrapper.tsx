'use client'

import { Bot } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import DocumentGenerationProgress from '@/components/document-generation-progress'
import { DocumentGenerationState } from '@/hooks/use-document-generation'

interface DocumentGenerationWrapperProps {
  documentGenerationState: DocumentGenerationState
}

export const DocumentGenerationWrapper = ({ documentGenerationState }: DocumentGenerationWrapperProps) => {
  if (documentGenerationState.documents.length === 0) {
    return null
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-start gap-1">
        {/* AI Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </AvatarFallback>
        </Avatar>

        {/* AI Name */}
        <span className="max-w-20 truncate text-xs text-muted-foreground">AI助手</span>
      </div>

      {/* Document Generation Content */}
      <div className="max-w-[85%]">
        <DocumentGenerationProgress
          documents={documentGenerationState.documents}
          currentDocumentIndex={documentGenerationState.currentDocumentIndex}
          isGenerating={documentGenerationState.isGenerating}
          error={documentGenerationState.error}
          overallProgress={documentGenerationState.overallProgress}
          createdDocumentCount={documentGenerationState.createdDocumentCount}
          failedDocumentCount={documentGenerationState.failedDocumentCount}
        />
      </div>
    </div>
  )
}
