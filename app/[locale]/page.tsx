import { getLocale } from 'next-intl/server'

import { redirect } from '@/i18n/navigation'

export default async function Home() {
  return <RedirectToChat />
}

async function RedirectToChat() {
  // Redirect authenticated users to chat
  const locale = await getLocale()
  redirect({ href: '/chat', locale })
  return null
}
