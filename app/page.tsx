import { redirect } from 'next/navigation'

import { AuthGuard } from '@/components/auth/auth-guard'

export default async function Home() {
  return (
    <AuthGuard>
      <RedirectToChat />
    </AuthGuard>
  )
}

function RedirectToChat() {
  // Redirect authenticated users to chat
  redirect('/chat')
  return null
}
