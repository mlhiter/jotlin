'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { Spinner } from '@/components/spinner'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

import { documentApi } from '@/api/document'
import { userApi } from '@/api/user'
import { useSession } from '@/hooks/use-session'
import { Doc } from '@/types/document'

interface InviteUserProps {
  collaborator: string
  document: Doc
  first?: boolean
}

export const InviteUser = ({ collaborator, document, first = false }: InviteUserProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useSession()
  const queryClient = useQueryClient()

  // 使用更具体的查询键，包含文档ID和协作者邮箱，避免缓存冲突
  const { data: collaboratorInfo, isLoading } = useQuery({
    queryKey: ['collaborator-info', document.id, collaborator],
    queryFn: () => userApi.getInfoByEmail({ email: collaborator }),
    enabled: !!collaborator && !!document.id, // 确保参数存在时才执行查询
  })

  const isOwner = document.userId === user?.id
  const isCurrentUser = collaborator === user?.email

  const onRemovePrivilege = () => {
    setIsSubmitting(true)

    const promise = documentApi
      .removeAccess({
        documentId: document.id,
        collaboratorEmail: collaborator,
      })
      .then(() => {
        // 刷新文档列表和协作者列表
        queryClient.invalidateQueries({
          queryKey: ['documents'],
          exact: false,
        })
        queryClient.invalidateQueries({
          queryKey: ['collaborators', document.id],
          exact: false,
        })
      })
      .finally(() => setIsSubmitting(false))

    toast.promise(promise, {
      loading: '移除中...',
      success: '权限已移除',
      error: '移除失败',
    })
  }

  // 生成用户名首字母作为头像备用显示
  const getInitials = (name: string | undefined, email: string) => {
    if (name) {
      return name.slice(0, 2).toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="flex h-12 items-center justify-center">
        <Spinner size="sm" />
      </div>
    )
  }

  if (!collaboratorInfo) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-x-3 rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
      <div className="flex min-w-0 flex-1 items-center gap-x-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={collaboratorInfo.image || ''} alt={collaboratorInfo.name || collaboratorInfo.email} />
          <AvatarFallback className="bg-blue-500 text-sm font-medium text-white">
            {getInitials(collaboratorInfo.name, collaboratorInfo.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-x-2">
            <span className="truncate text-sm font-medium">{collaboratorInfo.name || '未设置用户名'}</span>
            {first && (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                创建者
              </span>
            )}
            {!first && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                协作者
              </span>
            )}
          </div>
          <span className="truncate text-sm text-gray-500 dark:text-gray-400">{collaboratorInfo.email}</span>
        </div>
      </div>

      <div className="flex-shrink-0">
        {first ? (
          // 创建者不能移除自己
          <div className="w-16"></div>
        ) : isOwner || isCurrentUser ? (
          // 文档所有者可以移除协作者，协作者可以移除自己
          <Button
            onClick={onRemovePrivilege}
            disabled={isSubmitting}
            className="h-8 w-16 text-xs"
            size="sm"
            variant="destructive">
            {isSubmitting ? '...' : isCurrentUser ? '退出' : '移除'}
          </Button>
        ) : (
          // 非所有者不能移除其他人
          <div className="w-16"></div>
        )}
      </div>
    </div>
  )
}
