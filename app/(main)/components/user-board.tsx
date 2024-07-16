'use client'

import { useDocumentById } from '@/api/document'
import { InviteUser } from './invite-user'

interface UserBoardProps {
  documentId: string
}

export const UserBoard = ({ documentId }: UserBoardProps) => {
  const { document } = useDocumentById(documentId)

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
