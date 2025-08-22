import { Github } from 'lucide-react'

import AuthSocialButton from '@/components/buttons/auth-social-button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { useSession } from '@/hooks/use-session'
import { useAuth } from '@/stores/auth'

const SettingsModal = () => {
  const authModal = useAuth()

  const { signIn } = useSession()

  return (
    <Dialog open={authModal.isOpen} onOpenChange={authModal.onClose}>
      <DialogContent className="w-96">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg font-bold">Sign in</DialogTitle>
          <DialogDescription>to continue to jotlin</DialogDescription>
        </DialogHeader>
        <div className="flex  items-center justify-between">
          <AuthSocialButton icon={Github} onClick={() => signIn('github')} platform="GitHub" />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsModal
