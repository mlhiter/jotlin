'use client'

import { useState } from 'react'

import { ChatArea } from '@/components/chat/chat-area'

import { useAutoSave } from '@/hooks/use-auto-save'
import { useProjects } from '@/hooks/use-projects'

import { DocumentHeader } from './document-header'
import { MarkdownEditor } from './markdown-editor'

interface Document {
  id: string
  projectId: string | null
  workspaceId: string
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

  // Get project info for Chat tab
  const { projects } = useProjects(document.workspaceId)
  const project = projects?.find((p) => p.id === document.projectId)

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
        projectInfo={
          currentTab === 'chat' && project
            ? {
                title: project.title,
                icon: project.icon || undefined,
              }
            : undefined
        }
      />

      <div className="flex-1 overflow-hidden">
        {currentTab === 'editor' && <MarkdownEditor key={document.id} initialContent={content} onChange={setContent} />}

        {currentTab === 'chat' && document.projectId && (
          <ChatArea type="PROJECT" entityId={document.projectId} workspaceId={document.workspaceId} />
        )}

        {currentTab === 'chat' && !document.projectId && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">This document is not associated with a project</p>
          </div>
        )}
      </div>
    </div>
  )
}
