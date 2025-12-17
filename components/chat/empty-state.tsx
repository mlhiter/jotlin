'use client'

import { Brain, Code, Globe, FileText, Lightbulb } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onSendMessage: (message: { text: string }) => void
}

export function EmptyState({ onSendMessage }: EmptyStateProps) {
  const EXAMPLE_PROMPTS = [
    {
      icon: Globe,
      text: 'I want to build a mobile app for fitness tracking',
      description: 'Help me analyze requirements and define features',
    },
    {
      icon: FileText,
      text: 'I need to create a SaaS platform for team collaboration',
      description: 'Guide me through requirement gathering process',
    },
    {
      icon: Code,
      text: 'I have an idea for an e-commerce website',
      description: 'Let&apos;s define the core features and user scenarios',
    },
    {
      icon: Lightbulb,
      text: 'I want to digitize my traditional business',
      description: 'Help me understand what features I really need',
    },
  ]

  return (
    <div className="px-4 py-20 text-center">
      <Avatar className="mx-auto mb-4 h-12 w-12">
        <AvatarFallback className="bg-muted/40">
          <Brain className="text-muted-foreground h-6 w-6" strokeWidth={1.5} />
        </AvatarFallback>
      </Avatar>

      <h2 className="mb-2 break-words text-xl font-semibold">Let&apos;s Define Your Product Requirements</h2>
      <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-sm leading-relaxed">
        I&apos;m your AI requirements analyst. I&apos;ll help you clarify your goals, identify target users, and define
        core features through structured conversations.
      </p>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 px-4 md:grid-cols-2">
        {EXAMPLE_PROMPTS.map((prompt, index) => {
          const Icon = prompt.icon
          return (
            <Button
              key={index}
              variant="outline"
              className="hover:bg-accent/40 h-auto w-full justify-start border-border/40 p-4 text-left transition-all duration-150"
              onClick={() => onSendMessage({ text: prompt.text })}>
              <div className="flex w-full items-start gap-3">
                <Icon className="text-muted-foreground mt-1 h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <div className="whitespace-normal break-words text-sm font-medium leading-relaxed">{prompt.text}</div>
                  <div className="text-muted-foreground mt-1 whitespace-normal break-words text-xs leading-relaxed">
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
