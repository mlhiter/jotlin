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
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`)
    }

    return data.access_token
  }

  async getUserInfo(accessToken: string): Promise<GitHubUser> {
    const [userResponse, emailsResponse] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }),
    ])

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user info: ${userResponse.statusText}`)
    }

    const user = await userResponse.json()

    // Get primary email if not public
    if (!user.email && emailsResponse.ok) {
      const emails = await emailsResponse.json()
      const primaryEmail = emails.find((email: { primary: boolean }) => email.primary)
      if (primaryEmail) {
        user.email = primaryEmail.email
      }
    }

    return user
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
