'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  UserPlus,
  FileText,
  Trash2,
  Bot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/libs/utils'
import { useUnifiedNotifications } from '@/hooks/use-unified-notifications'
import { invitationApi } from '@/api/invitation'
import { chatApi } from '@/api/chat'
import { useQueryClient } from '@tanstack/react-query'
import { useDocumentStore } from '@/stores/document'

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

// 通知类型配置
const notificationConfig = {
  invitation: {
    icon: UserPlus,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    label: '文档邀请',
  },
  chat_invitation: {
    icon: MessageSquare,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    label: '聊天邀请',
  },
  mention: {
    icon: MessageSquare,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    label: '@提及',
  },
  comment_reply: {
    icon: MessageSquare,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    label: '回复',
  },
  comment_added: {
    icon: MessageSquare,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    label: '评论',
  },
  document_shared: {
    icon: FileText,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    label: '分享',
  },
  document_deleted: {
    icon: Trash2,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    label: '删除',
  },
  ai_response: {
    icon: Bot,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    label: 'AI回复',
  },
}

// 优先级配置
const priorityConfig = {
  high: {
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50',
  },
  medium: {
    borderColor: 'border-l-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  low: {
    borderColor: 'border-l-gray-300',
    bgColor: 'bg-gray-50',
  },
}

interface UnifiedInboxContentProps {
  className?: string
  documentId?: string // 如果提供，则只显示与此文档相关的通知
  onClose?: () => void // 关闭弹窗的回调
}

export function UnifiedInboxContent({
  className,
  documentId,
  onClose,
}: UnifiedInboxContentProps) {
  const [selectedType, setSelectedType] = useState<string>('all')
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setDocuments } = useDocumentStore()
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useUnifiedNotifications()

  // 统一的标记所有为已读处理
  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead()
    if (success) {
      toast.success('所有通知已标记为已读')
    } else {
      toast.error('操作失败')
    }
  }

  // 接受文档邀请
  const acceptInvitation = async (invitationId: string, documentId: string) => {
    try {
      // 接受邀请
      await invitationApi.update({
        id: invitationId,
        isAccepted: true,
      })

      // 刷新文档列表 - 清除所有文档查询缓存以重新获取最新数据
      queryClient.invalidateQueries({ queryKey: ['documents'] })

      // 手动触发文档列表更新
      await Promise.all([
        setDocuments(null, 'share'),
        setDocuments(null, 'private'),
      ])

      // 重新获取通知列表以更新状态
      await fetchNotifications()

      toast.success('邀请已接受')
      return true
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error('接受邀请失败')
      return false
    }
  }

  // 接受聊天邀请
  const acceptChatInvitation = async (
    chatInvitationId: string,
    chatId: string
  ) => {
    try {
      // 接受聊天邀请
      await chatApi.updateInvitation(chatId, chatInvitationId, {
        isAccepted: true,
      })

      // 刷新聊天相关的所有缓存
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] })
      queryClient.invalidateQueries({
        queryKey: ['chat-collaborators', chatId],
      })

      // 刷新文档列表以获得新的文档访问权限
      queryClient.invalidateQueries({ queryKey: ['documents'] })

      // 重新获取通知列表以更新状态
      await fetchNotifications()

      toast.success('聊天邀请已接受')
      return true
    } catch (error) {
      console.error('Error accepting chat invitation:', error)
      toast.error('接受聊天邀请失败')
      return false
    }
  }

  // 处理通知点击
  const handleNotificationClick = async (notification: UnifiedNotification) => {
    try {
      // 根据通知类型进行不同的处理
      if (notification.type === 'invitation' && notification.invitationId) {
        // 文档邀请类型：检查是否已经接受过
        if (notification.isRead) {
          // 已经接受过的邀请，直接跳转到文档
          if (notification.documentId) {
            router.push(`/documents/${notification.documentId}`)
            onClose?.()
          }
        } else {
          // 未接受的邀请，自动接受并跳转到文档
          const success = await acceptInvitation(
            notification.invitationId,
            notification.documentId!
          )

          if (success && notification.documentId) {
            // 接受成功后跳转到文档
            router.push(`/documents/${notification.documentId}`)
            // 关闭弹窗
            onClose?.()
          }
        }
      } else if (
        notification.type === 'chat_invitation' &&
        (notification as any).chatInvitationId
      ) {
        // 聊天邀请类型：检查是否已经接受过
        if (notification.isRead) {
          // 已经接受过的邀请，直接跳转到聊天
          if ((notification as any).chatId) {
            router.push(`/chats/${(notification as any).chatId}`)
            onClose?.()
          }
        } else {
          // 未接受的邀请，自动接受并跳转到聊天
          const success = await acceptChatInvitation(
            (notification as any).chatInvitationId,
            (notification as any).chatId!
          )

          if (success && (notification as any).chatId) {
            // 接受成功后跳转到聊天
            router.push(`/chats/${(notification as any).chatId}`)
            // 关闭弹窗
            onClose?.()
          }
        }
      } else {
        // 非邀请类型：先标记为已读，然后处理跳转
        if (!notification.isRead) {
          await markAsRead(notification.id)
        }

        if (notification.documentId) {
          // 跳转到相关文档
          router.push(`/documents/${notification.documentId}`)
        }

        // 关闭弹窗
        onClose?.()
      }
    } catch (error) {
      console.error('Error handling notification click:', error)
      toast.error('操作失败')
    }
  }

  // 首先按文档过滤（如果指定了 documentId）
  const documentFilteredNotifications = documentId
    ? notifications.filter(
        (notification) => notification.documentId === documentId
      )
    : notifications

  // 然后按类型过滤
  const filteredNotifications = documentFilteredNotifications.filter(
    (notification) => {
      if (selectedType === 'all') return true
      return notification.type === selectedType
    }
  )

  // 获取通知类型统计（基于文档过滤后的通知）
  const typeStats = documentFilteredNotifications.reduce(
    (acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // 如果是文档级别的通知，显示对应的未读数量
  const displayUnreadCount = documentId
    ? documentFilteredNotifications.filter((n) => !n.isRead).length
    : unreadCount

  // 显示的总数量
  const displayTotalCount = documentId
    ? documentFilteredNotifications.length
    : notifications.length

  // 组件打开时获取通知列表
  useEffect(() => {
    fetchNotifications()
  }, [])

  return (
    <div className={cn('w-96', className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-medium">{documentId ? '文档通知' : '通知'}</h3>
          {displayUnreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
            </Badge>
          )}
        </div>
        {displayUnreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isLoading}
            className="h-auto p-1 text-xs">
            <CheckCheck className="mr-1 h-3 w-3" />
            全部已读
          </Button>
        )}
      </div>

      <Separator />

      {/* 过滤标签 */}
      <div className="p-2">
        <div className="flex flex-wrap gap-1">
          <Button
            variant={selectedType === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedType('all')}
            className="h-7 px-2 text-xs">
            全部 ({displayTotalCount})
          </Button>
          {Object.entries(typeStats).map(([type, count]) => {
            const config =
              notificationConfig[type as keyof typeof notificationConfig]
            if (!config) return null

            return (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="h-7 px-2 text-xs">
                {config.label} ({count})
              </Button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* 通知列表 */}
      <ScrollArea className="h-[400px]">
        {filteredNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {selectedType === 'all'
              ? '暂无通知'
              : `暂无${notificationConfig[selectedType as keyof typeof notificationConfig]?.label || ''}通知`}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredNotifications.map((notification) => {
              const config =
                notificationConfig[
                  notification.type as keyof typeof notificationConfig
                ] || notificationConfig.comment_added
              const priorityStyle =
                priorityConfig[
                  notification.priority as keyof typeof priorityConfig
                ] || priorityConfig.medium
              const IconComponent = config.icon

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border-l-4 p-3 transition-colors hover:bg-accent',
                    priorityStyle.borderColor,
                    !notification.isRead && 'bg-blue-50 shadow-sm'
                  )}
                  onClick={() => handleNotificationClick(notification)}>
                  {/* 图标 */}
                  <div className={cn('mt-0.5 flex-shrink-0', config.color)}>
                    <IconComponent className="h-4 w-4" />
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>

                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {notification.content}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {notification.documentTitle && (
                        <span className="truncate font-medium">
                          {notification.documentTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
