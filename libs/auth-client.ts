import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  // If the auth server is running on the same domain as your client, you can omit the baseURL
})

export const { signIn, signUp, signOut, useSession } = authClient
