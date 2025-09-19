'use client'

import { Brain, Code, Globe, FileText, Lightbulb } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onSendMessage: (message: { text: string }) => void
}

export function EmptyState({ onSendMessage }: EmptyStateProps) {
  const t = useTranslations('chat')

  const EXAMPLE_PROMPTS = [
    {
      icon: Globe,
      text: t('examples.mobileApp'),
      description: t('examples.mobileAppDesc'),
    },
    {
      icon: FileText,
      text: t('examples.saasplatform'),
      description: t('examples.saasPlatformDesc'),
    },
    {
      icon: Code,
      text: t('examples.ecommerce'),
      description: t('examples.ecommerceDesc'),
    },
    {
      icon: Lightbulb,
      text: t('examples.digitize'),
      description: t('examples.digitizeDesc'),
    },
  ]
  return (
    <div className="px-4 py-20 text-center">
      <Avatar className="mx-auto mb-4 h-12 w-12">
        <AvatarFallback className="bg-muted">
          <Brain className="h-6 w-6 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>

      <h2 className="mb-2 text-xl font-semibold break-words">{t('emptyStateTitle')}</h2>
      <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {t('emptyStateDescription')}
      </p>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 px-4 md:grid-cols-2">
        {EXAMPLE_PROMPTS.map((prompt, index) => {
          const Icon = prompt.icon
          return (
            <Button
              key={index}
              variant="outline"
              className="h-auto w-full justify-start p-4 text-left hover:bg-muted/50"
              onClick={() => onSendMessage({ text: prompt.text })}>
              <div className="flex w-full items-start gap-3">
                <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-relaxed font-medium break-words whitespace-normal">{prompt.text}</div>
                  <div className="mt-1 text-xs leading-relaxed break-words whitespace-normal text-muted-foreground">
                    {prompt.description}
                  </div>
                </div>
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
