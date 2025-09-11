'use client'

import {
  BookOpen,
  Bot,
  Command,
  LifeBuoy,
  MessageSquare,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { NavMain } from '@/components/nav-main'
import { NavProjects } from '@/components/nav-projects'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { useAuth } from '@/hooks/use-auth'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Chat',
      url: '/chat',
      icon: MessageSquare,
      isActive: true,
      items: [
        {
          title: 'New Chat',
          url: '/chat',
        },
        {
          title: 'Chat History',
          url: '/chat/history',
        },
      ],
    },
    // {
    //   title: 'Dashboard',
    //   url: '/dashboard',
    //   icon: SquareTerminal,
    //   items: [
    //     {
    //       title: 'Overview',
    //       url: '/dashboard',
    //     },
    //     {
    //       title: 'Analytics',
    //       url: '/dashboard/analytics',
    //     },
    //   ],
    // },
    // {
    //   title: 'Models',
    //   url: '#',
    //   icon: Bot,
    //   items: [
    //     {
    //       title: 'GPT-4',
    //       url: '#',
    //     },
    //     {
    //       title: 'Claude',
    //       url: '#',
    //     },
    //     {
    //       title: 'Gemini',
    //       url: '#',
    //     },
    //   ],
    // },
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings2,
      items: [
        {
          title: 'Profile',
          url: '/settings/profile',
        },
        {
          title: 'Preferences',
          url: '/settings/preferences',
        },
        {
          title: 'API Keys',
          url: '/settings/api-keys',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
    },
  ],
  projects: [
    {
      name: 'Recent Chats',
      url: '/chat',
      icon: MessageSquare,
    },
    {
      name: 'Analytics',
      url: '/dashboard/analytics',
      icon: PieChart,
    },
    {
      name: 'Documentation',
      url: '/docs',
      icon: BookOpen,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Sidebar variant="inset" {...props}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Sidebar>
    )
  }

  if (!user) {
    return (
      <Sidebar variant="inset" {...props}>
        <div className="flex flex-col items-center justify-center h-full p-4 space-y-4">
          <p className="text-sm text-muted-foreground text-center">Please sign in to access your dashboard</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Jotlin Agent</span>
                  <span className="truncate text-xs">Chat Assistant</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: user.image || '/avatars/default.jpg',
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
