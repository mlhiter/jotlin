'use client'

import { useQuery } from '@tanstack/react-query'

import { getInvitationsByEmail } from '@/api/invitation'
import { useSession } from '@/hooks/use-session'
import { Spinner } from '@/components/spinner'
import { ScrollArea } from '@/components/ui/scroll-area'

import InviteItem from './invite-item'

const InboxContent = () => {
  const { user } = useSession()
  const { data: invitations } = useQuery({
    queryKey: ['invitations', user?.email],
    queryFn: () => getInvitationsByEmail(user?.email as string),
  })

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
        <div key={invitation.id}>
          <InviteItem invitation={invitation} />
        </div>
      ))}
    </ScrollArea>
  )
}

export default InboxContent
