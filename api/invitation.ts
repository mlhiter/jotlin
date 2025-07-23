import { GET, POST, PUT } from '@/libs/axios'
import { Invitation } from '@/types/invitation'

type CreateParams = Pick<
  Invitation,
  'documentId' | 'collaboratorEmail' | 'userEmail'
>

export const createInvitation = (invitation: CreateParams) =>
  POST<Invitation>('/api/invitations/create', invitation)

export const getInvitationsByEmail = (email: string) =>
  GET<Invitation[]>(`/api/invitations/get-by-email?email=${email}`)

type UpdateParams = Pick<Invitation, 'isAccepted' | 'id'>
export const updateInvitation = (invitation: UpdateParams) =>
  PUT<Invitation>('/api/invitations/update', invitation)
