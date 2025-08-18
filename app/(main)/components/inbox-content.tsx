'use client'

import { useSession } from '@/hooks/use-session'
import { Spinner } from '@/components/spinner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInvitationStore } from '@/stores/invitation'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

import InviteItem from './invite-item'

const InboxContent = () => {
  const { user } = useSession()
  const { invitations, fetchInvitations, markInboxAsViewed } =
    useInvitationStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 当 Inbox 弹窗打开时，标记inbox为已查看
  useEffect(() => {
    if (user?.email) {
      markInboxAsViewed(user.email)
    }
  }, [user?.email, markInboxAsViewed])

  const handleRefresh = async () => {
    if (!user?.email || isRefreshing) return

    setIsRefreshing(true)
    try {
      await fetchInvitations(user.email)
    } catch (error) {
      console.error('Failed to refresh invitations:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (invitations === null) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-4">
        <div className="text-sm text-muted-foreground">No invitations</div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 px-3">
          <RefreshCw
            className={`mr-2 h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          Invitations ({invitations.length})
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 p-0">
          <RefreshCw
            className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>
      <ScrollArea className="h-[350px]">
        {invitations.map((invitation, index) => (
          <div
            key={invitation.id}
            className={index < invitations.length - 1 ? 'mb-3' : ''}>
            <InviteItem invitation={invitation} />
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}

export default InboxContent
