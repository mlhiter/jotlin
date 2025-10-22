import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/libs/utils/utils'

interface LoadingProps {
  className?: string
  variant?: 'spinner' | 'skeleton' | 'full'
}

export const Loading = ({ className }: LoadingProps) => {
  const t = useTranslations('chat')

  return (
    <div className={cn('fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </div>
    </div>
  )
}
