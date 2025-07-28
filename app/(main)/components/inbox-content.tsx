'use client'

import { Spinner } from '@/components/spinner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInvitationStore } from '@/stores/invitation'

import InviteItem from './invite-item'

const InboxContent = () => {
  const { invitations } = useInvitationStore()

  if (!invitations) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    )
  }

  if (invitations.length === 0) {
    return <div>No invitations</div>
  }

  return (
    <ScrollArea className="h-[400px]">
      {invitations.map((invitation) => (
        <div key={invitation.id}>
          <InviteItem invitation={invitation} />
        </div>
      ))}
    </ScrollArea>
  )
}

export default InboxContent
