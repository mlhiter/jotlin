import { auth } from '@/libs/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { POST, GET } = toNextJsHandler(auth)
