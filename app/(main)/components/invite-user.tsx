'use client'

import { toast } from 'sonner'
import { useState } from 'react'

import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage } from '@/components/ui/avatar'

import { Doc, removeAccess } from '@/api/document'
import { useSession } from '@/hooks/use-session'
import { useUserInfoByEmail } from '@/api/user'

interface InviteUserProps {
  collaborator: string
  document: Doc
  first?: boolean
}

export const InviteUser = ({
  collaborator,
  document,
  first = false,
}: InviteUserProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useSession()
  const { userInfo: collaboratorInfo, isLoading } =
    useUserInfoByEmail(collaborator)

  const isOwner = document.userId === user?._id

  const onRemovePrivilege = () => {
    setIsSubmitting(true)

    const promise = removeAccess(document._id, collaborator).finally(() =>
      setIsSubmitting(false)
    )

    toast.promise(promise, {
      loading: 'removing...',
      success: 'Privilege has been removed',
      error: 'Failed to remove him.',
    })
  }

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )

  return (
    <div className="mt-4 flex items-center  justify-between gap-x-2 pl-1">
      <div className="flex items-center justify-between gap-x-2">
        <Avatar className="h-7 w-7">
          <AvatarImage
            src={collaboratorInfo?.imageUrl}
            alt={collaboratorInfo?.username}></AvatarImage>
        </Avatar>
        <div>
          {collaboratorInfo && first ? (
            <div className="text-rose-400">创建者</div>
          ) : collaboratorInfo ? (
            <div>协作人</div>
          ) : null}
        </div>
        <div className="text-base font-light">
          {collaboratorInfo?.emailAddress}
        </div>
      </div>
      {first || !isOwner ? (
        <Button className="hidden h-8 w-16"></Button>
      ) : (
        <Button
          onClick={onRemovePrivilege}
          disabled={isSubmitting}
          className="h-8 w-16 text-xs"
          size="sm"
          variant="destructive">
          remove
        </Button>
      )}
    </div>
  )
}
