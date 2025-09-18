import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { AuthGuard } from '@/components/auth/auth-guard'

export default async function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthGuard>
        <RedirectToChat />
      </AuthGuard>
    </Suspense>
  )
}

function RedirectToChat() {
  // Redirect authenticated users to chat
  redirect('/chat')
  return null
}
