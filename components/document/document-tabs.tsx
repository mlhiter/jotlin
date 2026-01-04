'use client'

import { FileEdit, MessageSquare } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DocumentTabsProps {
  editorContent: React.ReactNode
  chatContent: React.ReactNode
  defaultTab?: 'editor' | 'chat'
}

export function DocumentTabs({ editorContent, chatContent, defaultTab = 'editor' }: DocumentTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="flex h-full flex-col">
      <div className="border-b px-6">
        <TabsList className="h-12">
          <TabsTrigger value="editor" className="gap-2">
            <FileEdit className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="editor" className="flex-1 overflow-hidden">
        {editorContent}
      </TabsContent>

      <TabsContent value="chat" className="flex-1 overflow-hidden">
        {chatContent}
      </TabsContent>
    </Tabs>
  )
}
