import { GET } from '@/libs/axios'
import { User } from '@/types/user'

export const userApi = {
  getInfoByEmail: async (data: { email: string }) => {
    return GET<User>('/api/users/get-info-by-email', data)
  },
}
