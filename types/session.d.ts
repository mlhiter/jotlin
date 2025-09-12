export interface BetterAuthSession {
  session: {
    id: string
    userId: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
    token: string
    ipAddress?: string | null | undefined | undefined
    userAgent?: string | null | undefined | undefined
  }
  user: {
    id: string
    email: string
    emailVerified: boolean
    name: string
    createdAt: Date
    updatedAt: Date
    image?: string | null | undefined | undefined
  }
}
