import { z } from 'zod'

export const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  token: z.string(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
})

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  name: z.string(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
  createdAt: z.date(),
  updatedAt: z.date(),
  image: z.string().nullable(),
  messageLimit: z.number(),
})

export type Session = z.infer<typeof sessionSchema>
export type User = z.infer<typeof userSchema>

export const authSessionSchema = z.object({
  user: userSchema,
  token: z.string(),
})

export type AuthSession = z.infer<typeof authSessionSchema>

export const sealosSessionSchema = z.object({
  user: z.object({
    id: z.string(),
    k8sUsername: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
    nsid: z.string(),
  }),
  token: z.string(),
  kubeconfig: z.string(),
})

export const sealosTokenSchema = z.object({
  userUid: z.string(),
  userCrUid: z.string(),
  userCrName: z.string(),
  regionUid: z.string(),
  userId: z.string(),
  workspaceId: z.string(),
  workspaceUid: z.string(),
  iat: z.number(),
  exp: z.number(),
})

export type SealosSession = z.infer<typeof sealosSessionSchema>
export type SealosToken = z.infer<typeof sealosTokenSchema>
