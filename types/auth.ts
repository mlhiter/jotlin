export interface JWTPayload {
  userId: string
  email: string
  name: string
  image?: string | null
  iat?: number
  exp?: number
}

export type OAuthProvider = 'github' | 'google' | 'sealos'

export interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

export interface GitHubOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface GoogleUser {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}

export interface GoogleOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}
