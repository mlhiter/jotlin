'use client'

import { toast } from 'sonner'
import { FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { invitationApi } from '@/api/invitation'
import { useSession } from '@/hooks/use-session'

import { UserBoard } from './user-board'

interface InviteProps {
  documentId: string
}

const Invite = ({ documentId }: InviteProps) => {
  const [collaboratorEmail, setCollaboratorEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useSession()

  const onInvite = async (e: FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    const loadingToast = toast.loading('Inviting...')
    try {
      await invitationApi
        .create({
          documentId,
          collaboratorEmail,
          userEmail: user!.email,
        })
        .finally(() => setIsSubmitting(false))
      toast.success('Invitation has been sent')
    } catch (error) {
      toast.error('Failed to invite him.')
    } finally {
      toast.dismiss(loadingToast)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost">
          Invite
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end" alignOffset={8} forceMount>
        <form onSubmit={onInvite} className="flex space-x-1">
          <input
            type="email"
            required
            disabled={isSubmitting}
            onChange={(e) => setCollaboratorEmail(e.target.value)}
            placeholder="Enter collaborator email..."
            className="h-8 flex-1 truncate rounded-md border bg-muted px-2 text-xs focus-within:ring-transparent"
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-8 text-xs"
            size="sm">
            Submit
          </Button>
        </form>
        <UserBoard documentId={documentId} />
      </PopoverContent>
    </Popover>
  )
}

export default Invite
