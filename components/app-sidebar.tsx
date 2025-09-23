'use client'

import { BookOpen, Bot, LifeBuoy, MessageSquare, PieChart, Send, Settings2, SquareTerminal } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import { NavChats } from '@/components/nav-chats'
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
import { UsageIndicator } from '@/components/usage-indicator'

import { useAuth } from '@/hooks/use-auth'
import { Link } from '@/i18n/navigation'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useAuth()
  const t = useTranslations('sidebar')

  const data = React.useMemo(
    () => ({
      user: {
        name: 'shadcn',
        email: 'm@example.com',
        avatar: '/avatars/shadcn.jpg',
      },
      navMain: [
        {
          title: t('chat'),
          url: '/chat',
          icon: MessageSquare,
          isActive: true,
          items: [
            {
              title: t('newChat'),
              url: '/chat',
            },
            {
              title: t('chatHistory'),
              url: '/chat/history',
            },
          ],
        },
        {
          title: t('dashboard'),
          url: '/dashboard',
          icon: SquareTerminal,
          items: [
            {
              title: t('overview'),
              url: '/dashboard',
            },
            {
              title: t('analytics'),
              url: '/dashboard/analytics',
            },
          ],
        },
        {
          title: t('models'),
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
          title: t('settings'),
          url: '/settings',
          icon: Settings2,
          items: [
            {
              title: t('profile'),
              url: '/settings/profile',
            },
            {
              title: t('preferences'),
              url: '/settings/preferences',
            },
            {
              title: t('apiKeys'),
              url: '/settings/api-keys',
            },
          ],
        },
      ],
      navSecondary: [
        {
          title: t('support'),
          url: '#',
          icon: LifeBuoy,
        },
        {
          title: t('feedback'),
          url: '#',
          icon: Send,
        },
      ],
      projects: [
        {
          name: t('analytics'),
          url: '/dashboard/analytics',
          icon: PieChart,
        },
        {
          name: t('documentation'),
          url: '/docs',
          icon: BookOpen,
        },
      ],
    }),
    [t]
  )

  if (isLoading) {
    return (
      <Sidebar variant="inset" {...props}>
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </Sidebar>
    )
  }

  if (!user) {
    return (
      <Sidebar variant="inset" {...props}>
        <div className="flex h-full flex-col items-center justify-center space-y-4 p-4">
          <p className="text-center text-sm text-muted-foreground">{t('pleaseSignIn')}</p>
          <Button asChild>
            <Link href="/login">{t('signIn')}</Link>
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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Image src="/logo-white.svg" alt="Jotlin Agent" width={16} height={16} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{t('appName')}</span>
                  <span className="truncate text-xs">{t('appDescription')}</span>
                </div>
              </a>
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
              name: user.name,
              email: user.email,
              avatar: user.image || '/avatars/default.jpg',
            }}
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
