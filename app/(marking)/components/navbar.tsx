'use client'

import Link from 'next/link'
import { ArrowRightFromLine, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/spinner'
import { ModeToggle } from '@/components/mode-toggle'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { cn } from '@/libs/utils'
import { useAuth } from '@/stores/auth'
import { useSession } from '@/hooks/use-session'
import { useScrollTop } from '@/hooks/use-scroll-top'

import Logo from './logo'

const Navbar = () => {
  const { session, isLoading, signOut, user } = useSession()
  const scrolled = useScrollTop()
  const authModal = useAuth()
  return (
    <div
      className={cn(
        'fixed top-0 z-50 flex w-full items-center bg-background p-6 dark:bg-[#1F1F1F]',
        scrolled && 'border-b shadow-sm'
      )}>
      <Logo />
      <div className="flex w-full items-center justify-between gap-x-2 md:ml-auto md:justify-end">
        {isLoading && <Spinner />}
        {!session && !isLoading && (
          <>
            <Button variant="ghost" size="sm" onClick={authModal.onOpen}>
              Log in
            </Button>
            <Button size="sm" onClick={authModal.onOpen}>
              Get Jotlin free
            </Button>
          </>
        )}
        {session && !isLoading && (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/documents">Enter Jotlin</Link>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Avatar>
                  <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                </Avatar>
              </PopoverTrigger>
              <PopoverContent className="mr-16 grid w-80 grid-cols-3 items-center gap-x-1 gap-y-4">
                <div className="flex items-center justify-center">
                  <Avatar>
                    <AvatarImage src={user?.image || ''} alt={user?.name} />
                  </Avatar>
                </div>
                <div className="col-span-2 font-medium">
                  <span>{user?.name}</span>
                </div>
                <div className="flex items-center justify-center ">
                  <Settings className="h-4 w-4 text-stone-400" />
                </div>
                <div className="col-span-2 cursor-pointer">
                  <span className="font-normal text-stone-500">
                    Manage account
                  </span>
                </div>
                <div className="flex items-center justify-center ">
                  <ArrowRightFromLine className="h-4 w-4 text-stone-400" />
                </div>
                <div className="col-span-2 cursor-pointer" onClick={signOut}>
                  <span className="font-normal text-stone-500">Sign out</span>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
        <ModeToggle />
      </div>
    </div>
  )
}

export default Navbar
