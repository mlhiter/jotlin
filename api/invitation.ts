import { GET, POST, PUT } from '@/libs/axios'
import { Invitation } from '@/types/invitation'

type CreateParams = Pick<
  Invitation,
  'documentId' | 'collaboratorEmail' | 'userEmail'
>

type UpdateParams = Pick<Invitation, 'isAccepted' | 'id'>

export const invitationApi = {
  create: async (invitation: CreateParams) => {
    return POST<Invitation>('/api/invitations/create', invitation)
  },

  getByEmail: async (email: string) => {
    return GET<Invitation[]>('/api/invitations/get-by-email', { email })
  },

  update: async (invitation: UpdateParams) => {
    return PUT<Invitation>(`/api/invitations/${invitation.id}`, invitation)
  },
}
