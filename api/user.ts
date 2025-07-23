import { GET } from '@/libs/axios'
import { User } from '@/types/user'

export const getUserInfoByEmail = (data: { email: string }) =>
  GET<User>('/api/users/get-info-by-email', data)
