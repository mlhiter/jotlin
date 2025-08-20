'use client'

import { useQuery } from '@tanstack/react-query'

import { documentApi } from '@/api/document'
import { userApi } from '@/api/user'
import { useSession } from '@/hooks/use-session'

import { InviteUser } from './invite-user'

interface UserBoardProps {
  documentId: string
}

export const UserBoard = ({ documentId }: UserBoardProps) => {
  const { user } = useSession()

  // 使用专门的协作者接口，它返回完整的用户信息列表（包括创建者）
  const { data: collaboratorsInfo } = useQuery({
    queryKey: ['document-collaborators', documentId],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${documentId}/collaborators`)
      if (!response.ok) {
        throw new Error('Failed to fetch collaborators')
      }
      return response.json()
    },
    enabled: !!documentId,
  })

  // 获取文档基本信息（用于权限检查等）
  const { data: document } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentApi.getById(documentId),
    enabled: !!documentId,
  })

  if (!collaboratorsInfo || !document) {
    return null
  }

  return (
    <div className="mt-4 space-y-1">
      {collaboratorsInfo.map((collaborator: any, index: number) => (
        <InviteUser
          collaborator={collaborator.userEmail}
          document={document}
          key={collaborator.userEmail}
          first={index === 0} // 第一个是创建者
        />
      ))}
    </div>
  )
}
