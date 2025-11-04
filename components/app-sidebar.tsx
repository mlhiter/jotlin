'use client'

import { BookOpen, Bot, MessageSquare, PieChart, Send, Settings2, SquareTerminal, Shield } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ComponentProps, useState } from 'react'

import { FeedbackDialog } from '@/components/dialog/feedback-dialog'
import { NavChats } from '@/components/nav-chats'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { UsageIndicator } from '@/components/usage-indicator'

import { useAuth } from '@/hooks/use-auth'

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { user, isAdmin } = useAuth()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

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
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: SquareTerminal,
        items: [
          {
            title: 'Overview',
            url: '/dashboard',
          },
          {
            title: 'Analytics',
            url: '/dashboard/analytics',
          },
        ],
      },
      {
        title: 'Models',
        url: '#',
        icon: Bot,
        items: [
          {
            title: 'GPT-4',
            url: '#',
          },
          {
            title: 'Claude',
            url: '#',
          },
          {
            title: 'Gemini',
            url: '#',
          },
        ],
      },
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
        title: 'Feedback',
        url: '#',
        icon: Send,
        onClick: () => setFeedbackOpen(true),
      },
      ...(user && isAdmin
        ? [
            {
              title: 'Admin Panel',
              url: '/admin/feedback',
              icon: Shield,
            },
          ]
        : []),
    ],
    projects: [
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

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image src="/logo-white.svg" alt="Jotlin Agent" width={16} height={16} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Jotlin Agent</span>
                  <span className="truncate text-xs">Chat Assistant</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        <NavChats />
        {/* <NavProjects projects={data.projects} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <div className="space-y-3">
          <UsageIndicator />
          <NavUser
            user={{
              name: user?.name || '',
              email: user?.email || '',
              avatar: user?.image || '/avatars/default.svg',
            }}
          />
        </div>
      </SidebarFooter>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </Sidebar>
  )
}
