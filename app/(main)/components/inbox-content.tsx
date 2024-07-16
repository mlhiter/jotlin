'use client'

import { useInvitationByEmail } from '@/api/invitation'
import { useSession } from '@/hooks/use-session'
import { Spinner } from '@/components/spinner'
import { ScrollArea } from '@/components/ui/scroll-area'

import InviteItem from './invite-item'

const InboxContent = () => {
  const { user } = useSession()
  const { invitations } = useInvitationByEmail(user?.emailAddress as string)

  if (invitations === undefined) {
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
        <div key={invitation._id}>
          <InviteItem invitation={invitation} />
        </div>
      ))}
    </ScrollArea>
  )
}

export default InboxContent
