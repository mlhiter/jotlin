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
    <div className="text-center py-20 px-4">
      <Avatar className="h-12 w-12 mx-auto mb-4">
        <AvatarFallback className="bg-muted">
          <Brain className="h-6 w-6 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>

      <h2 className="text-xl font-semibold mb-2 break-words">Let&apos;s Define Your Product Requirements</h2>
      <p className="text-muted-foreground text-sm max-w-2xl mx-auto mb-8 leading-relaxed">
        I&apos;m your AI requirements analyst. I&apos;ll help you clarify your goals, identify target users, and define
        core features through structured conversations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto px-4">
        {EXAMPLE_PROMPTS.map((prompt, index) => {
          const Icon = prompt.icon
          return (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 text-left justify-start hover:bg-muted/50 w-full"
              onClick={() => onSendMessage({ text: prompt.text })}>
              <div className="flex items-start gap-3 w-full">
                <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm break-words leading-relaxed whitespace-normal">{prompt.text}</div>
                  <div className="text-xs text-muted-foreground mt-1 break-words leading-relaxed whitespace-normal">
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
