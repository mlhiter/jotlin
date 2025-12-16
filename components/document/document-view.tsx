'use client'

import { useState } from 'react'
import { DocumentHeader } from './document-header'
import { useAutoSave } from '@/hooks/use-auto-save'

interface Document {
  id: string
  title: string
  content: string
  documentType: string
  icon: string | null
  isAIGenerated: boolean
  lastEditedAt: string
}

interface DocumentViewProps {
  document: Document
}

export function DocumentView({ document }: DocumentViewProps) {
  const [content, setContent] = useState(document.content)
  const [currentTab, setCurrentTab] = useState('editor')

  const { status, lastSavedAt } = useAutoSave({
    documentId: document.id,
    content,
    delay: 1000,
    initialLastSavedAt: document.lastEditedAt ? new Date(document.lastEditedAt) : null,
  })

  return (
    <div className="flex h-full flex-col">
      <DocumentHeader
        documentId={document.id}
        title={document.title}
        documentType={document.documentType}
        icon={document.icon || undefined}
        isAIGenerated={document.isAIGenerated}
        saveStatus={status}
        lastSavedAt={lastSavedAt}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      <div className="flex-1 overflow-hidden">
        {currentTab === 'editor' && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your document in Markdown..."
            className="h-full w-full resize-none border-0 p-6 font-mono text-sm outline-none focus:outline-none focus-visible:ring-0"
          />
        )}

        {currentTab === 'chat' && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Document Chat coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
