import { redirect } from 'next/navigation'

export default async function Home() {
  return <RedirectToChat />
}

function RedirectToChat() {
  // Redirect authenticated users to chat
  redirect('/chat')
  return null
}
