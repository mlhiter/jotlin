'use client'

import { Github } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useAuth } from '@/hooks/use-auth'

export function LoginForm() {
  const { isLoading, signIn } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to Jotlin</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => signIn('github')} disabled={isLoading} className="w-full" size="lg">
            <Github className="mr-2 h-4 w-4" />
            {isLoading ? 'Signing in...' : 'Continue with GitHub'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
