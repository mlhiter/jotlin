'use client'

import { Brain, Code, Globe, FileText, Lightbulb } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onSendMessage: (message: { text: string }) => void
}

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
    description: "Let's define the core features and user scenarios",
  },
  {
    icon: Lightbulb,
    text: 'I want to digitize my traditional business',
    description: 'Help me understand what features I really need',
  },
]

export function EmptyState({ onSendMessage }: EmptyStateProps) {
  return (
    <div className="px-4 py-20 text-center">
      <Avatar className="mx-auto mb-4 h-12 w-12">
        <AvatarFallback className="bg-muted">
          <Brain className="h-6 w-6 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>

      <h2 className="mb-2 text-xl font-semibold break-words">Let&apos;s Define Your Product Requirements</h2>
      <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
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
