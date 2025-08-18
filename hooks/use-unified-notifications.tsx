import { useState, useEffect, useCallback } from 'react'

interface UnifiedNotification {
  id: string
  type: string
  title: string
  content: string
  isRead: boolean
  priority: string
  createdAt: string
  documentId?: string
  documentTitle?: string
  commentId?: string
  senderId?: string
  senderName?: string
  senderEmail?: string
  invitationId?: string
}

export function useUnifiedNotifications() {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // 获取通知列表
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unified')
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
  }, [])

  // 获取未读数量
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unified?countOnly=true')
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
  }, [])

  // 标记单个通知为已读
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/unified?id=${notificationId}`,
        {
          method: 'PATCH',
        }
      )

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
        return true
      }
      return false
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }, [])

  // 标记所有通知为已读
  const markAllAsRead = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        '/api/notifications/unified?markAllAsRead=true',
        {
          method: 'PATCH',
        }
      )

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
        return true
      }
      return false
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始化加载和定期刷新
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // 每30秒检查一次
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  }
}
