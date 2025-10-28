import { Loader } from 'lucide-react'

import { cn } from '@/libs/utils/utils'

interface LoadingProps {
  className?: string
  variant?: 'spinner' | 'skeleton' | 'full'
}

export const Loading = ({ className }: LoadingProps) => {
  return (
    <div className={cn('bg-background/80 fixed inset-0 flex items-center justify-center backdrop-blur-sm', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  )
}
