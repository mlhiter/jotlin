'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { SaveStatus } from '@/hooks/use-auto-save'

import { ChatHeader } from './chat-header'
import { EditorHeader } from './editor-header'

interface ChatThread {
  id: string
  title: string | null
  messageCount: number
  lastMessageAt: Date
}

interface DocumentHeaderProps {
  // Document props (for Editor tab)
  documentId: string
  title: string
  documentType: string
  icon?: string
  isAIGenerated?: boolean
  saveStatus: SaveStatus
  lastSavedAt: Date | null

  // Tab control
  currentTab?: string
  onTabChange?: (tab: string) => void

  // Project props (for Chat tab)
  projectId?: string
  workspaceId?: string
  projectTitle?: string
  projectIcon?: string
  projectDescription?: string
  threads?: ChatThread[]
  currentThreadId?: string | null
  onSelectThread?: (threadId: string) => void
  onCreateThread?: () => void
  onRenameThread?: (threadId: string, newTitle: string) => void
  onDeleteThread?: (threadId: string) => void
  threadsLoading?: boolean
}

export function DocumentHeader({
  documentId,
  title,
  documentType,
  icon,
  isAIGenerated,
  saveStatus,
  lastSavedAt,
  currentTab = 'editor',
  onTabChange,
  projectId,
  workspaceId,
  projectTitle,
  projectIcon,
  projectDescription,
  threads = [],
  currentThreadId,
  onSelectThread,
  onCreateThread,
  onRenameThread,
  onDeleteThread,
  threadsLoading = false,
}: DocumentHeaderProps) {
  const isEditorTab = currentTab === 'editor'
  const isChatTab = currentTab === 'chat'

  return (
    <div className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex flex-1 items-center">
        {isEditorTab && (
          <EditorHeader
            documentId={documentId}
            title={title}
            documentType={documentType}
            icon={icon}
            isAIGenerated={isAIGenerated}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
          />
        )}

        {isChatTab && projectId && workspaceId && projectTitle && (
          <ChatHeader
            projectId={projectId}
            workspaceId={workspaceId}
            title={projectTitle}
            icon={projectIcon}
            description={projectDescription}
            threads={threads}
            currentThreadId={currentThreadId}
            onSelectThread={onSelectThread}
            onCreateThread={onCreateThread}
            onRenameThread={onRenameThread}
            onDeleteThread={onDeleteThread}
            threadsLoading={threadsLoading}
          />
        )}
      </div>

      <Tabs value={currentTab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="editor" className="gap-1.5 text-sm">
            Editor
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5 text-sm">
            Chat
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
