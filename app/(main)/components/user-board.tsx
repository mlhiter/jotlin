'use client'

import { useQuery } from '@tanstack/react-query'

import { documentApi } from '@/api/document'
import { InviteUser } from './invite-user'

interface UserBoardProps {
  documentId: string
}

export const UserBoard = ({ documentId }: UserBoardProps) => {
  const { data: document } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentApi.getById(documentId),
  })

  return (
    <div className="mt-2 space-y-2">
      {document?.collaborators?.map((collaborator, index) =>
        index === 0 ? (
          <InviteUser
            collaborator={collaborator}
            document={document}
            key={collaborator}
            first
          />
        ) : (
          <InviteUser
            collaborator={collaborator}
            document={document}
            key={collaborator}
          />
        )
      )}
    </div>
  )
}
