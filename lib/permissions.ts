import { User } from '@/schema/session'

export const canAccessAdminPanel = (user: User) => {
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
}
