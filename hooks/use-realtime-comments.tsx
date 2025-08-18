'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface Comment {
  id: string
  content: string
  blockId: string
  createdAt: string
  updatedAt?: string
  replyToCommentId?: string | null
  replyOrder: number
  isAIReply?: boolean
  user: {
    name: string
    image: string
    email: string
  }
  replyToComment?: {
    id: string
    user: {
      name: string
      image: string
      email: string
    }
  } | null
}

interface UseRealtimeCommentsOptions {
  documentId: string
  enabled?: boolean
  pollingInterval?: number // 轮询间隔，默认5秒
  onNewComments?: (newComments: Comment[]) => void
}

export function useRealtimeComments({
  documentId,
  enabled = true,
  pollingInterval = 5000,
  onNewComments,
}: UseRealtimeCommentsOptions) {
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isEnabledRef = useRef(enabled)
  const onNewCommentsRef = useRef(onNewComments)
  const lastUpdateTimeRef = useRef<string | null>(null)
  const isPollingRef = useRef(false)

  // 更新refs以获取最新值
  useEffect(() => {
    isEnabledRef.current = enabled
    onNewCommentsRef.current = onNewComments
    lastUpdateTimeRef.current = lastUpdateTime
    isPollingRef.current = isPolling
  }, [enabled, onNewComments, lastUpdateTime, isPolling])

  // 检查新评论的函数
  const checkForNewComments = useCallback(async () => {
    if (!isEnabledRef.current || !documentId || isPollingRef.current) {
      return
    }

    try {
      setIsPolling(true)
      isPollingRef.current = true

      // 构建查询参数
      const params = new URLSearchParams({
        documentId,
        incrementalUpdate: 'true',
      })

      // 如果有上次更新时间，只获取该时间之后的评论
      // 减去2秒缓冲时间以避免时间戳精度问题
      if (lastUpdateTimeRef.current) {
        const bufferTime = new Date(
          new Date(lastUpdateTimeRef.current).getTime() - 2000
        )
        params.append('since', bufferTime.toISOString())
      }

      const response = await fetch(`/api/comments?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }

      const data = await response.json()

      // 处理增量更新响应
      if (data.isIncremental) {
        // 如果有新评论，通知组件
        if (data.comments && data.comments.length > 0) {
          onNewCommentsRef.current?.(data.comments)
        }
        // 更新最后更新时间
        if (data.lastUpdateTime) {
          setLastUpdateTime(data.lastUpdateTime)
          lastUpdateTimeRef.current = data.lastUpdateTime
        }
      } else {
        // 首次加载，只设置时间戳，不通知新评论
        const newTime = new Date().toISOString()
        setLastUpdateTime(newTime)
        lastUpdateTimeRef.current = newTime
      }
    } catch (error) {
      console.error('Error checking for new comments:', error)
    } finally {
      setIsPolling(false)
      isPollingRef.current = false
    }
  }, [documentId]) // 只依赖documentId

  // 启动轮询
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // 立即检查一次（初始化最后更新时间）
    checkForNewComments()

    // 设置定时轮询
    intervalRef.current = setInterval(() => {
      checkForNewComments()
    }, pollingInterval)
  }, [checkForNewComments, pollingInterval])

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // 手动触发检查
  const triggerCheck = useCallback(() => {
    checkForNewComments()
  }, [checkForNewComments])

  // 重置状态（当文档切换时）
  const reset = useCallback(() => {
    setLastUpdateTime(null)
    setIsPolling(false)
    stopPolling()
  }, [stopPolling])

  // 当documentId变化时重置状态
  useEffect(() => {
    reset()
  }, [documentId, reset])

  // 当enabled状态变化时启动或停止轮询
  useEffect(() => {
    if (enabled && documentId) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, documentId, startPolling, stopPolling])

  // 页面可见性变化时的处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else if (enabled && documentId) {
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, documentId, startPolling, stopPolling])

  return {
    isPolling,
    triggerCheck,
    reset,
    lastUpdateTime,
  }
}
