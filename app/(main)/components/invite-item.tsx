'use client'

import { mutate } from 'swr'
import { useEffect, useState } from 'react'
import { FileIcon } from 'lucide-react'

import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage } from '@/components/ui/avatar'

import { useSession } from '@/hooks/use-session'
import { useBasicInfoById } from '@/api/document'
import { User, getUserInfoByEmail } from '@/api/user'
import { Invitation, update } from '@/api/invitation'

type UserInfo = Pick<User, 'username' | 'imageUrl'>

interface InviteItemProps {
  invitation: Invitation
}

const InviteItem = ({ invitation }: InviteItemProps) => {
  const { user } = useSession()
  const {
    _id,
    documentId,
    userEmail,
    collaboratorEmail,
    isAccepted,
    isReplied,
    isValid,
  } = invitation
  const { documentInfo } = useBasicInfoById(documentId)
  const [userInfo, setUserInfo] = useState<UserInfo | undefined>(undefined)

  useEffect(() => {
    // TODO: 逻辑看不懂了
    if (collaboratorEmail === user?.emailAddress) {
      const fetchUserInfo = async () => {
        try {
          const response = await getUserInfoByEmail(userEmail)
          setUserInfo(response.data)
          console.log(response)
        } catch (error) {
          console.error('Error fetching userInfo:', error)
        }
      }
      fetchUserInfo()
    }
  }, [collaboratorEmail, user?.emailAddress, userEmail])

  const accept = async () => {
    try {
      await update({ _id, isAccepted: true })
    } catch (error) {
      console.log(error)
    }
  }
  const reject = async () => {
    try {
      await update({ _id, isAccepted: false })
    } catch (error) {
      console.log(error)
    }
  }

  // if document has been removed or user has been removed or the invitation is invalid
  if (!isValid) {
    return (
      <div className="h-10">
        <div className="text-gray-500">This invitation has been expired</div>
        <Separator className="mt-2" />
      </div>
    )
  }

  if (documentInfo === undefined || userInfo === undefined) {
    return (
      <div className="flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      {/* 你是邀请人 */}
      {userEmail === user?.emailAddress && (
        <div className="mt-2 flex items-start gap-x-2">
          <Avatar className="mt-2 h-7 w-7">
            <AvatarImage
              src={user?.imageUrl}
              alt={user.username!}></AvatarImage>
          </Avatar>
          <div>
            You invite <span className="font-light">{collaboratorEmail}</span>{' '}
            to
            <span className="ml-2">
              {documentInfo?.icon ? (
                <span>{documentInfo.icon}</span>
              ) : (
                <FileIcon className="text-muted-foreground" />
              )}
              <span className="font-medium">{documentInfo?.title}</span>
            </span>
            <div className="text-right text-xs font-medium text-muted-foreground">
              {!isReplied
                ? 'No reply yet'
                : isReplied && isAccepted
                  ? 'Accepted'
                  : 'rejected'}
            </div>
          </div>
        </div>
      )}
      {/* 你是被邀请人 */}
      {collaboratorEmail === user?.emailAddress && (
        <div className="mt-2 flex items-start gap-x-2">
          <Avatar className="mt-2 h-7 w-7">
            <AvatarImage
              src={userInfo?.imageUrl}
              alt={userInfo?.username}></AvatarImage>
          </Avatar>
          <div>
            <span className="font-light">{userEmail}</span> invite you to to
            <span className="ml-2">
              {documentInfo?.icon ? (
                <span>{documentInfo.icon}</span>
              ) : (
                <FileIcon
                  className="inline-block text-muted-foreground"
                  size={20}
                />
              )}
              <span className="align-middle font-medium">
                {documentInfo?.title}
              </span>
            </span>
            <div className="mt-2 text-right text-xs font-medium text-muted-foreground">
              {!isReplied ? (
                <div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-neutral-800"
                    onClick={accept}>
                    accept
                  </Button>
                  <button onClick={reject} className="ml-2 text-sm">
                    reject
                  </button>
                </div>
              ) : isReplied && isAccepted ? (
                'Accepted'
              ) : (
                'rejected'
              )}
            </div>
          </div>
        </div>
      )}
      <Separator className="mt-2" />
    </>
  )
}

export default InviteItem
