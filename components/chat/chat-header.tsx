'use client'

import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import ChatExportMenu from '@/components/chat-export-menu'
import ChatInvite from '@/components/chat-invite'
import { RequirementGenerator } from '@/components/requirement-generator'
import { Button } from '@/components/ui/button'

interface ChatHeaderProps {
  chat: any
  chatId: string
  chatLoading: boolean
  requirementSubmitted: boolean
  onRequirementSubmitted: (requirement: string) => void
}

export const ChatHeader = ({
  chat,
  chatId,
  chatLoading,
  requirementSubmitted,
  onRequirementSubmitted,
}: ChatHeaderProps) => {
  const queryClient = useQueryClient()

  return (
    <div className="border-b">
      <div className="flex items-center justify-between p-4 pb-2">
        <h1 className="text-xl font-semibold">{chat?.title}</h1>
        <div className="flex items-center gap-2">
          <ChatInvite chatId={chatId} />
          {chat?.documents && chat.documents.length > 0 && (
            <ChatExportMenu
              chatId={chatId}
              chatTitle={chat.title}
              chatDescription={chat.description || undefined}
              documents={chat.documents}
              disabled={chatLoading}
            />
          )}
          {!requirementSubmitted ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Scroll to requirement generator
                const reqGenerator = document.getElementById('requirement-generator')
                reqGenerator?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-sm text-muted-foreground hover:text-foreground">
              Start inputting requirement →
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">✅ Requirement submitted, you can start chatting</div>
          )}
        </div>
      </div>

      {/* Requirement Generator - Always visible in header area */}
      {!requirementSubmitted && (
        <div className="px-4 pb-4" id="requirement-generator">
          <RequirementGenerator
            isEmbedded={true}
            onRequirementSubmitted={onRequirementSubmitted}
            onDocumentCreated={() => {
              toast.success('Documents created')
              // Refresh linked documents
              queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
            }}
            className="rounded-lg bg-muted/50 p-4"
          />
        </div>
      )}
    </div>
  )
}
