'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useConvexAuth } from 'convex/react'
import { Spinner } from '@/components/spinner'
import Link from 'next/link'
import { SignInButton } from '@clerk/clerk-react'

const Heading = () => {
  const { isAuthenticated, isLoading } = useConvexAuth()
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold">
        Your Ideas,Documents,&Plans. Unified. Welcome to&nbsp;
        <span className="underline">Jotlin</span>
      </h1>
      <h3 className="text-base sm:text-xl md:text-2xl font-medium">
        Jotlin is the connected workspace where <br />
        better ,faster work happens.
      </h3>
      {/* 加载动画 */}
      {isLoading && (
        <div className="w-full flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}
      {/* 登录之后显示 */}
      {isAuthenticated && !isLoading && (
        <Button asChild>
          <Link href="/documents">
            Enter Jotlin
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      )}
      {/* 未登录时的显示框 */}
      {!isAuthenticated && !isLoading && (
        <SignInButton mode="modal">
          <Button>
            Get Jotlin free
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </SignInButton>
      )}
    </div>
  )
}

export default Heading
