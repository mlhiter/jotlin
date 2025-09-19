'use client'

import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ChatList } from '@/components/chat/chat-list'
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenuButton } from '@/components/ui/sidebar'

import { useChats } from '@/hooks/use-chat'
import { Link } from '@/i18n/navigation'

export function NavChats() {
  const t = useTranslations('sidebar')
  const { chats } = useChats()
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>{t('chatHistory')}</SidebarGroupLabel>
        {chats.length > 0 && (
          <SidebarMenuButton asChild size="sm" className="h-8 w-8">
            <Link href="/chat">
              <Plus className="h-3 w-3" />
              <span className="sr-only">{t('newChat')}</span>
            </Link>
          </SidebarMenuButton>
        )}
      </div>
      <SidebarGroupContent>
        <ChatList />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
