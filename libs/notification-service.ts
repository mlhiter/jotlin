import { ParsedMention } from './mention-parser'

export interface NotificationData {
  type: string
  title: string
  content: string
  userId: string
  documentId?: string
  commentId?: string
  mentionId?: string
}

/**
 * 创建通知
 */
export async function createNotification(data: NotificationData) {
  try {
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to create notification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating notification:', error)
    throw new Error('Failed to create notification')
  }
}

/**
 * 为@提及创建通知
 */
export async function createMentionNotifications(
  mentions: ParsedMention[],
  commentId: string,
  documentId: string,
  mentionerName: string,
  documentTitle: string
) {
  try {
    const response = await fetch('/api/mentions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mentions,
        commentId,
        documentId,
        mentionerName,
        documentTitle,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create mention notifications')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating mention notifications:', error)
    throw new Error('Failed to create mention notifications')
  }
}

/**
 * 获取用户的未读通知 (这个函数现在直接通过API调用，这里保留是为了向后兼容)
 */
export async function getUserNotifications(userId: string, limit: number = 20) {
  try {
    const response = await fetch(`/api/notifications?limit=${limit}`)

    if (!response.ok) {
      throw new Error('Failed to fetch notifications')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching notifications:', error)
    throw new Error('Failed to fetch notifications')
  }
}

/**
 * 标记通知为已读 (现在通过API调用)
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  try {
    const response = await fetch(`/api/notifications?id=${notificationId}`, {
      method: 'PATCH',
    })

    if (!response.ok) {
      throw new Error('Failed to mark notification as read')
    }

    return await response.json()
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw new Error('Failed to mark notification as read')
  }
}

/**
 * 标记所有通知为已读 (现在通过API调用)
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const response = await fetch('/api/notifications?markAllAsRead=true', {
      method: 'PATCH',
    })

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read')
    }

    return await response.json()
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw new Error('Failed to mark all notifications as read')
  }
}

/**
 * 获取未读通知数量 (现在通过API调用)
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const response = await fetch('/api/notifications?countOnly=true')

    if (!response.ok) {
      throw new Error('Failed to get unread notification count')
    }

    const data = await response.json()
    return data.count || 0
  } catch (error) {
    console.error('Error getting unread notification count:', error)
    return 0
  }
}
