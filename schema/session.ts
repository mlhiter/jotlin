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
  createdAt: z.date(),
  updatedAt: z.date(),
  image: z.string().nullish(),
})

export const betterAuthSessionSchema = z.object({
  session: sessionSchema,
  user: userSchema,
})

export type BetterAuthSession = z.infer<typeof betterAuthSessionSchema>
export type Session = z.infer<typeof sessionSchema>
export type User = z.infer<typeof userSchema>
