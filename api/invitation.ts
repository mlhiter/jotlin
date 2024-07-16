import axios from '@/lib/axios'
import useSWR, { mutate as globalMutate } from 'swr'

export interface Invitation {
  _id: string
  documentId: string
  userEmail: string
  collaboratorEmail: string
  isAccepted: boolean
  isReplied: boolean
  isValid: boolean
}

type CreateParams = Pick<
  Invitation,
  'documentId' | 'collaboratorEmail' | 'userEmail'
>
// create a new invitation
export const create = (invitation: CreateParams) => {
  return axios.post('/api/invitation/create', invitation)
}

// get invitation by email
const fetcher = (url: string) => axios.get(url).then((res) => res.data)
export const useInvitationByEmail = (email: string) => {
  const {
    data: invitations,
    mutate,
    isLoading,
    error,
  } = useSWR<Invitation[]>(
    `/api/invitation/get-by-email?email=${email}`,
    fetcher
  )
  return {
    invitations,
    mutate,
    isLoading,
    error,
  }
}

type UpdateParams = Pick<Invitation, 'isAccepted' | '_id'>
// update invitation
export const update = async (invitation: UpdateParams) => {
  await axios.put('/api/invitation/update', invitation)
  globalMutate(
    (key) =>
      typeof key === 'string' && key.startsWith('/api/invitation/get-by-email')
  )
}
