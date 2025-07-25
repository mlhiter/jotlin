'use client'

import { redirect } from 'next/navigation'

import { Spinner } from '@/components/spinner'
import { SearchCommand } from '@/components/search-command'

import { useSession } from '@/hooks/use-session'
import Navigation from './components/navigation'

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useSession()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }
  if (!session) {
    return redirect('/')
  }

  return (
    <div className="flex h-full dark:bg-[#1F1F1F]">
      <Navigation />
      <main className="h-full flex-1 overflow-y-auto">
        <SearchCommand />
        {children}
      </main>
    </div>
  )
}

export default MainLayout
