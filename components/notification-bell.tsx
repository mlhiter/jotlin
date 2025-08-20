'use client'

import { formatDistanceToNow } from 'date-fns'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Notification {
  id: string
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
  documentId?: string
  commentId?: string
}

interface NotificationBellProps {
  documentId?: string // 如果提供，则只显示与此文档相关的通知
}

export function NotificationBell({ documentId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // 获取通知
  const fetchNotifications = async () => {
    try {
      const url = documentId
        ? `/api/notifications?documentId=${documentId}`
        : '/api/notifications'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setNotifications(Array.isArray(data) ? data : [])
      } else {
        console.error('Failed to fetch notifications:', response.status)
        setNotifications([])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
    }
  }

  // 获取未读数量
  const fetchUnreadCount = async () => {
    try {
      const url = documentId
        ? `/api/notifications?countOnly=true&documentId=${documentId}`
        : '/api/notifications?countOnly=true'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data?.count || 0)
      } else {
        console.error('Failed to fetch unread count:', response.status)
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
      setUnreadCount(0)
    }
  }

  // 标记单个通知为已读
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'PATCH',
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      setIsLoading(true)
      const url = documentId
        ? `/api/notifications?markAllAsRead=true&documentId=${documentId}`
        : '/api/notifications?markAllAsRead=true'
      const response = await fetch(url, {
        method: 'PATCH',
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
        toast.success('所有通知已标记为已读')
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('操作失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 处理通知点击
  const handleNotificationClick = async (notification: Notification) => {
    // 标记为已读
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }

    // 跳转到相关页面
    if (notification.documentId) {
      router.push(`/documents/${notification.documentId}`)
      setIsOpen(false)
    }
  }

  // 定期获取未读数量
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // 每30秒检查一次
    return () => clearInterval(interval)
  }, [])

  // 打开时获取通知列表
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center p-0 text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel>通知</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={isLoading}
              className="h-auto p-1 text-xs">
              <CheckCheck className="mr-1 h-3 w-3" />
              全部已读
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              暂无通知
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex cursor-pointer items-start gap-3 p-3 ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{notification.title}</p>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {notification.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
