'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, FileIcon, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Spinner } from '@/components/spinner'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { documentApi } from '@/api/document'
import { invitationApi } from '@/api/invitation'
import { userApi } from '@/api/user'
import { useSession } from '@/hooks/use-session'
import { useDocumentStore } from '@/stores/document'
import { useInvitationStore } from '@/stores/invitation'
import { Invitation } from '@/types/invitation'
import { User } from '@/types/user'

type UserInfo = Pick<User, 'name' | 'image'>

interface InviteItemProps {
  invitation: Invitation
}

const InviteItem = ({ invitation }: InviteItemProps) => {
  const { user } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { updateInvitation } = useInvitationStore()
  const { setDocuments } = useDocumentStore()
  const { id, documentId, userEmail, collaboratorEmail, isAccepted, isReplied, isValid } = invitation
  const { data: documentInfo } = useQuery({
    queryKey: ['documentInfo', documentId],
    queryFn: () => documentApi.getBasicInfoById(documentId),
  })

  const [userInfo, setUserInfo] = useState<UserInfo | undefined>(undefined)

  useEffect(() => {
    if (collaboratorEmail === user?.email) {
      const fetchUserInfo = async () => {
        try {
          const response = await userApi.getInfoByEmail({ email: userEmail })
          setUserInfo(response)
        } catch (error) {
          console.error('Error fetching userInfo:', error)
        }
      }
      fetchUserInfo()
    }
  }, [collaboratorEmail, user?.email, userEmail])

  const accept = async () => {
    try {
      await updateInvitation({ id, isAccepted: true })

      // 刷新文档列表 - 清除所有文档查询缓存以重新获取最新数据
      queryClient.invalidateQueries({ queryKey: ['documents'] })

      // 手动触发文档列表更新
      await Promise.all([setDocuments(null, 'share'), setDocuments(null, 'private')])

      // 路由到被邀请的文档
      router.push(`/documents/${documentId}`)
    } catch (error) {
      console.error(error)
    }
  }
  const reject = async () => {
    try {
      await updateInvitation({ id, isAccepted: false })
    } catch (error) {
      console.error(error)
    }
  }

  // if document has been removed or user has been removed or the invitation is invalid
  if (!isValid) {
    return (
      <Card className="border-none bg-background">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
            <X className="h-4 w-4" />
            This invitation has expired
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show loading only if document info is undefined or if we need user info but don't have it
  if (documentInfo === undefined || (collaboratorEmail === user?.email && userInfo === undefined)) {
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
        <Badge variant="outline" className="rounded-full bg-background/50 px-2.5 py-0.5 text-xs font-normal">
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
    <Card className="overflow-hidden border-none bg-background">
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
                  You invited <span className="text-muted-foreground">{collaboratorEmail}</span>
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
              <AvatarImage src={userInfo?.image || ''} alt={userInfo?.name || ''} />
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">{userEmail}</span> invited you
                </div>
                {isReplied && <div className="ml-auto flex-shrink-0">{getStatusBadge()}</div>}
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
                    className="h-8 px-2.5 text-xs font-normal hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    onClick={reject}>
                    <X className="mr-1 h-3.5 w-3.5" />
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 bg-primary px-2.5 text-xs font-normal hover:bg-primary/90"
                    onClick={accept}>
                    <CheckCircle className="mr-1 h-3.5 w-3.5" />
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
