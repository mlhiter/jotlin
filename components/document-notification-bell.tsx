'use client'

import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { UnifiedInboxContent } from '@/app/(main)/components/unified-inbox-content'
import { useUnifiedNotifications } from '@/hooks/use-unified-notifications'

interface DocumentNotificationBellProps {
  documentId: string
}

export function DocumentNotificationBell({
  documentId,
}: DocumentNotificationBellProps) {
  const { notifications } = useUnifiedNotifications()
  const [documentUnreadCount, setDocumentUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  // 计算与当前文档相关的未读通知数量
  useEffect(() => {
    const documentNotifications = notifications.filter(
      (notification) =>
        notification.documentId === documentId && !notification.isRead
    )
    setDocumentUnreadCount(documentNotifications.length)
  }, [notifications, documentId])

  // 如果没有与此文档相关的通知，则不显示铃铛
  if (documentUnreadCount === 0) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {documentUnreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center p-0 text-xs">
              {documentUnreadCount > 9 ? '9+' : documentUnreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-auto p-0">
        <div className="border-b p-2">
          <div className="text-sm font-medium text-muted-foreground">
            当前文档通知
          </div>
        </div>
        <UnifiedInboxContent
          className="w-80"
          documentId={documentId}
          onClose={() => setIsOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
