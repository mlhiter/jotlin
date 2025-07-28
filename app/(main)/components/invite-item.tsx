'use client'

import { CheckCircle, FileIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { User } from '@/types/user'
import { getUserInfoByEmail } from '@/api/user'
import { Invitation } from '@/types/invitation'
import { useSession } from '@/hooks/use-session'
import { getBasicInfoById } from '@/api/document'
import { updateInvitation as update } from '@/api/invitation'

type UserInfo = Pick<User, 'name' | 'image'>

interface InviteItemProps {
  invitation: Invitation
}

const InviteItem = ({ invitation }: InviteItemProps) => {
  const { user } = useSession()
  const {
    id,
    documentId,
    userEmail,
    collaboratorEmail,
    isAccepted,
    isReplied,
    isValid,
  } = invitation
  const { data: documentInfo } = useQuery({
    queryKey: ['documentInfo', documentId],
    queryFn: () => getBasicInfoById(documentId),
  })

  const [userInfo, setUserInfo] = useState<UserInfo | undefined>(undefined)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await getUserInfoByEmail({ email: userEmail })
        setUserInfo(response)
      } catch (error) {
        console.error('Error fetching userInfo:', error)
      }
    }
    fetchUserInfo()
  }, [userEmail])

  const accept = async () => {
    try {
      await update({ id, isAccepted: true })
    } catch (error) {
      console.log(error)
    }
  }
  const reject = async () => {
    try {
      await update({ id, isAccepted: false })
    } catch (error) {
      console.log(error)
    }
  }

  // if document has been removed or user has been removed or the invitation is invalid
  if (!isValid) {
    return (
      <Card className="mb-3 border-none bg-background">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
            <X className="h-4 w-4" />
            This invitation has expired
          </div>
        </CardContent>
      </Card>
    )
  }

  if (documentInfo === undefined || userInfo === undefined) {
    return (
      <div className="flex h-16 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Determine status badge variant and text
  const getStatusBadge = () => {
    if (!isReplied) {
      return (
        <Badge
          variant="outline"
          className="rounded-full bg-background/50 px-2.5 py-0.5 text-xs font-normal">
          Pending
        </Badge>
      )
    } else if (isReplied && isAccepted) {
      return (
        <Badge
          variant="secondary"
          className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-normal text-emerald-600 dark:bg-emerald-500/10">
          Accepted
        </Badge>
      )
    } else {
      return (
        <Badge
          variant="secondary"
          className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-normal text-rose-600 dark:bg-rose-500/10">
          Rejected
        </Badge>
      )
    }
  }

  return (
    <Card className="mb-3 overflow-hidden border-none bg-background">
      <CardContent className="p-4">
        {/* you are the inviter */}
        {userEmail === user?.email && (
          <div className="flex items-start gap-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  You invited{' '}
                  <span className="text-muted-foreground">
                    {collaboratorEmail}
                  </span>
                </div>
                <div className="ml-auto flex-shrink-0">{getStatusBadge()}</div>
              </div>

              <div className="mt-2 flex items-center rounded-lg bg-muted/30 px-3 py-2 text-sm">
                {documentInfo?.icon ? (
                  <span className="mr-2 text-base">{documentInfo.icon}</span>
                ) : (
                  <FileIcon className="mr-2 h-4 w-4 text-muted-foreground/70" />
                )}
                <span className="truncate">{documentInfo?.title}</span>
              </div>
            </div>
          </div>
        )}

        {/* you are the invited person */}
        {collaboratorEmail === user?.email && (
          <div className="flex items-start gap-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={userInfo?.image || ''}
                alt={userInfo?.name || ''}
              />
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">{userEmail}</span>{' '}
                  invited you
                </div>
                {isReplied && (
                  <div className="ml-auto flex-shrink-0">
                    {getStatusBadge()}
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center rounded-lg bg-muted/30 px-3 py-2 text-sm">
                {documentInfo?.icon ? (
                  <span className="mr-2 text-base">{documentInfo.icon}</span>
                ) : (
                  <FileIcon className="mr-2 h-4 w-4 text-muted-foreground/70" />
                )}
                <span className="truncate">{documentInfo?.title}</span>
              </div>

              {!isReplied && (
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs font-normal hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    onClick={reject}>
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 bg-primary px-3 text-xs font-normal hover:bg-primary/90"
                    onClick={accept}>
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                    Accept
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default InviteItem
