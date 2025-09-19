'use client'

import { Plus } from 'lucide-react'

import { ChatList } from '@/components/chat/chat-list'
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenuButton } from '@/components/ui/sidebar'

import { useChats } from '@/hooks/use-chat'
import { Link } from '@/i18n/navigation'

export function NavChats() {
  const { chats } = useChats()
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>Chat History</SidebarGroupLabel>
        {chats.length > 0 && (
          <SidebarMenuButton asChild size="sm" className="h-8 w-8">
            <Link href="/chat">
              <Plus className="h-3 w-3" />
              <span className="sr-only">New Chat</span>
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
