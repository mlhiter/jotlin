import axios from 'axios'

import type { GitHubUser, GitHubOAuthConfig } from '@/types/auth'

export class GitHubOAuth {
  private config: GitHubOAuthConfig

  constructor(config: GitHubOAuthConfig) {
    this.config = config
  }

  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'read:user user:email',
      response_type: 'code',
      ...(state && { state }),
    })

    return `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )

      const data = response.data

      if (data.error) {
        throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`)
      }

      return data.access_token
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to exchange code for token: ${error.response?.statusText || error.message}`)
      }
      throw error
    }
  }

  async getUserInfo(accessToken: string): Promise<GitHubUser> {
    try {
      const [userResponse, emailsResponse] = await Promise.all([
        axios.get('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }),
        axios
          .get('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          })
          .catch(() => null), // Don't fail if emails endpoint fails
      ])

      const user = userResponse.data

      // Get primary email if not public
      if (!user.email && emailsResponse) {
        const emails = emailsResponse.data
        const primaryEmail = emails.find((email: { primary: boolean }) => email.primary)
        if (primaryEmail) {
          user.email = primaryEmail.email
        }
      }

      return user
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch user info: ${error.response?.statusText || error.message}`)
      }
      throw error
    }
  }

  async authenticateWithCode(code: string): Promise<GitHubUser> {
    const accessToken = await this.exchangeCodeForToken(code)
    return this.getUserInfo(accessToken)
  }
}

export const githubOAuth = new GitHubOAuth({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/github/callback`,
})
