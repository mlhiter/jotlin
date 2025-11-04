'use client'

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Github } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

import { useAuth } from '@/hooks/use-auth'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectTo?: string
}

export function AuthDialog({ open, onOpenChange, redirectTo = '/' }: AuthDialogProps) {
  const { signIn, isLoading } = useAuth()

  const handleGitHubSignIn = () => {
    signIn('github', redirectTo)
    onOpenChange(false)
  }

  const handleGoogleSignIn = () => {
    signIn('google', redirectTo)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-0 p-0 sm:max-w-md sm:rounded-2xl">
        <VisuallyHidden>
          <DialogTitle>Sign in to Jotlin</DialogTitle>
          <DialogDescription>Choose your preferred sign-in method to continue</DialogDescription>
        </VisuallyHidden>
        <div className="relative bg-gradient-to-b from-cyan-50/50 to-transparent px-6 pb-6 pt-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
              <Image src="/logo.svg" alt="Jotlin" width={32} height={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-medium text-zinc-900">Welcome to Jotlin</h2>
              <p className="text-sm text-zinc-500">Sign in to start turning your ideas into structured specs</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 bg-white px-6 pb-8 pt-2">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-medium text-zinc-900 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <button
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-medium text-zinc-900 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                fill="#181717"
              />
            </svg>
            {isLoading ? 'Signing in...' : 'Continue with GitHub'}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-zinc-400">Secured & Private</span>
            </div>
          </div>

          <p className="text-center text-xs leading-relaxed text-zinc-400">
            By continuing, you agree to our Terms of Service and acknowledge our Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
