'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { User } from 'lucide-react'
import { useState, FormEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { chatApi } from '@/api/chat'
import { useSession } from '@/hooks/use-session'

interface ChatInviteProps {
  chatId: string
}

const ChatInvite = ({ chatId }: ChatInviteProps) => {
  const [collaboratorEmail, setCollaboratorEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useSession()
  const queryClient = useQueryClient()

  const { data: collaborators } = useQuery({
    queryKey: ['chat-collaborators', chatId],
    queryFn: () => chatApi.getCollaborators(chatId),
    enabled: !!chatId,
  })

  const inviteMutation = useMutation({
    mutationFn: (collaboratorEmail: string) =>
      chatApi.createInvitation(chatId, { collaboratorEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chat-collaborators', chatId],
      })
      // 刷新通知相关的缓存
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setCollaboratorEmail('')
      toast.success('Invitation sent successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data || 'Failed to send invitation')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (collaboratorEmail: string) =>
      chatApi.removeCollaborator(chatId, collaboratorEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chat-collaborators', chatId],
      })
      // 刷新聊天列表以更新协作者指示器
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      // 刷新通知缓存
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Collaborator removed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data || 'Failed to remove collaborator')
    },
  })

  const onInvite = async (e: FormEvent) => {
    e.preventDefault()
    if (!collaboratorEmail.trim()) return

    setIsSubmitting(true)
    try {
      await inviteMutation.mutateAsync(collaboratorEmail)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveCollaborator = (collaboratorEmail: string) => {
    if (confirm('Are you sure you want to remove this collaborator?')) {
      removeMutation.mutate(collaboratorEmail)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost">
          <User className="mr-2 h-4 w-4" />
          Collaborate
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end" alignOffset={8} forceMount>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Invite Collaborators</h3>
            <p className="text-sm text-muted-foreground">
              Collaborators can view and continue this chat, and access all
              linked documents.
            </p>
          </div>

          <form onSubmit={onInvite} className="flex space-x-1">
            <input
              type="email"
              required
              disabled={isSubmitting}
              value={collaboratorEmail}
              onChange={(e) => setCollaboratorEmail(e.target.value)}
              placeholder="Enter collaborator email..."
              className="h-8 flex-1 truncate rounded-md border bg-muted px-2 text-xs focus-within:ring-transparent"
            />
            <Button
              type="submit"
              disabled={isSubmitting || inviteMutation.isPending}
              className="h-8 text-xs"
              size="sm">
              Invite
            </Button>
          </form>

          {collaborators && collaborators.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Current Collaborators</h4>
              <div className="space-y-1">
                {collaborators.map((collaborator: any) => (
                  <div
                    key={collaborator.userEmail}
                    className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                        <User className="h-3 w-3" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {collaborator.user?.name || collaborator.userEmail}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {collaborator.userEmail}
                          {collaborator.isOwner && ' (Owner)'}
                        </div>
                      </div>
                    </div>
                    {!collaborator.isOwner &&
                      user?.email !== collaborator.userEmail && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleRemoveCollaborator(collaborator.userEmail)
                          }
                          disabled={removeMutation.isPending}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                          ×
                        </Button>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ChatInvite
