'use client'

import { Github } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { useAuth } from '@/hooks/use-auth'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectTo?: string
}

export function AuthDialog({ open, onOpenChange, redirectTo = '/' }: AuthDialogProps) {
  const { signIn, isLoading } = useAuth()

  const handleSignIn = () => {
    signIn('github', redirectTo)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Jotlin</DialogTitle>
          <DialogDescription>Sign in to your account to continue</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button onClick={handleSignIn} disabled={isLoading} className="w-full" size="lg">
            <Github className="mr-2 h-4 w-4" />
            {isLoading ? 'Signing in...' : 'Continue with GitHub'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
