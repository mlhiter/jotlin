'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'

import { useAuth } from '@/stores/use-auth'
import { useSession } from '@/hooks/use-session'

const Heading = () => {
  const authModal = useAuth()
  const { isLoading, session } = useSession()

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold sm:text-5xl md:text-6xl">
        Your Ideas,Documents,&Plans. Unified. With LLM.
      </h1>
      <h3 className="text-base font-medium sm:text-xl md:text-2xl">
        Jotlin is the workspace for you to unlock the potential
        <br />
        of LLM to writing, planning, and collaborating.
      </h3>
      {isLoading && (
        <div className="flex w-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}
      {session && !isLoading && (
        <Button asChild>
          <Link href="/documents">
            Enter Jotlin
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
      {!session && !isLoading && (
        <Button onClick={authModal.onOpen}>
          Get Jotlin free
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default Heading
