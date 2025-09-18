import jwt from 'jsonwebtoken'

import { SealosSession, sealosSessionSchema, SealosToken, sealosTokenSchema, User } from '@/schema/session'

export class SealosAuth {
  private jwtSecret: string

  constructor() {
    const secret = process.env.SEALOS_JWT_SECRET
    if (!secret) {
      throw new Error('SEALOS_JWT_SECRET not configured')
    }
    this.jwtSecret = secret
  }

  validateSession(sealosSession: object): SealosSession {
    return sealosSessionSchema.parse(sealosSession)
  }

  verifyToken(token: string): SealosToken {
    try {
      const decoded = jwt.verify(token, this.jwtSecret)
      return sealosTokenSchema.parse(decoded)
    } catch {
      throw new Error('Invalid or expired Sealos token')
    }
  }

  validateTokenAndSession(sealosSession: SealosSession): { session: SealosSession; token: SealosToken } {
    const validatedSession = this.validateSession(sealosSession)
    const decodedToken = this.verifyToken(validatedSession.token)

    // Ensure token userId matches session user id
    if (decodedToken.userId !== validatedSession.user.id) {
      throw new Error('Token userId mismatch')
    }

    return { session: validatedSession, token: decodedToken }
  }

  authenticateUser(sealosSession: SealosSession): User {
    const { session } = this.validateTokenAndSession(sealosSession)

    const { user } = session

    return {
      id: user.id,
      name: user.name,
      email: `${user.id}@sealos.internal`, // Generate internal email
      image: user.avatar || undefined,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
}

export const sealosAuth = new SealosAuth()
