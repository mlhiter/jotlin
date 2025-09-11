'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'

import { ChatList } from '@/components/chat/chat-list'
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenuButton } from '@/components/ui/sidebar'

export function NavChats() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>Chat History</SidebarGroupLabel>
        <SidebarMenuButton asChild size="sm" className="h-8 w-8">
          <Link href="/chat">
            <Plus className="h-3 w-3" />
            <span className="sr-only">New Chat</span>
          </Link>
        </SidebarMenuButton>
      </div>
      <SidebarGroupContent>
        <ChatList />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
