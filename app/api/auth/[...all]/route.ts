import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/libs/auth'

export const { POST, GET } = toNextJsHandler(auth)
