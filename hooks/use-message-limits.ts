'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import apiClient from '@/lib/axios'

interface UsageData {
  currentCount: number
  limit: number
  canSendMessage: boolean
}

interface MessageLimitError {
  error: string
  details: {
    currentCount: number
    limit: number
    message: string
  }
}

export function useMessageLimits() {
  const queryClient = useQueryClient()

  const {
    data: usage,
    isLoading,
    error,
  } = useQuery<UsageData>({
    queryKey: ['user-usage'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/auth/usage')
        return response.data
      } catch (error: unknown) {
        if ((error as { response?: { status?: number } }).response?.status === 401) {
          throw new Error('Unauthorized')
        }
        throw error
      }
    },
    refetchInterval: 30000,
    retry: (failureCount, error: unknown) => {
      if ((error as Error)?.message === 'Unauthorized') {
        return false
      }
      return failureCount < 3
    },
  })

  const refreshUsage = () => {
    queryClient.invalidateQueries({ queryKey: ['user-usage'] })
  }

  const handleMessageSent = () => {
    setTimeout(() => {
      refreshUsage()
    }, 1000)
  }

  const handleLimitError = (error: unknown) => {
    const errorObj = error as { status?: number; message?: string; body?: unknown }
    if (errorObj?.status === 429 || errorObj?.message?.includes('limit exceeded')) {
      let limitInfo: MessageLimitError | null = null

      try {
        if (typeof errorObj.body === 'string') {
          limitInfo = JSON.parse(errorObj.body)
        } else if (errorObj.body) {
          limitInfo = errorObj.body as MessageLimitError
        }
      } catch {}

      if (limitInfo?.details) {
        toast.error('Message Limit Reached', {
          description: `You have used ${limitInfo.details.currentCount}/${limitInfo.details.limit} messages. Please contact support for more quota.`,
          duration: 5000,
        })
      } else {
        toast.error('Message Limit Reached', {
          description: 'You have reached your message limit. Please contact support for more quota.',
          duration: 5000,
        })
      }

      refreshUsage()
      return true
    }

    return false
  }

  return {
    usage,
    isLoading,
    error,
    handleMessageSent,
    handleLimitError,
    refreshUsage,
  }
}
