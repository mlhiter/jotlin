'use client'

import { useMessageLimits } from '@/hooks/use-message-limits'

export function UsageIndicator() {
  const { usage, isLoading, error, refreshUsage } = useMessageLimits()

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-red-700">Usage Error</span>
          <button onClick={refreshUsage} className="text-xs text-red-600 hover:text-red-800">
            Retry
          </button>
        </div>
        <p className="mt-1 text-xs text-red-600">Failed to load usage data</p>
      </div>
    )
  }

  if (isLoading || !usage) {
    return (
      <div className="animate-pulse rounded-lg bg-gray-50 p-3">
        <div className="mb-2 h-4 w-24 rounded bg-gray-200"></div>
        <div className="h-2 w-full rounded bg-gray-200"></div>
      </div>
    )
  }

  const percentage = (usage.currentCount / usage.limit) * 100
  const isNearLimit = percentage > 80
  const isAtLimit = usage.currentCount >= usage.limit

  return (
    <div
      className={`rounded-lg border p-3 ${
        isAtLimit
          ? 'border-red-200 bg-red-50'
          : isNearLimit
            ? 'border-yellow-200 bg-yellow-50'
            : 'border-gray-200 bg-gray-50'
      }`}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">Message Limits</span>
        <span
          className={`font-mono text-xs ${
            isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-600'
          }`}>
          {usage.currentCount.toLocaleString()}/{usage.limit.toLocaleString()}
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-gray-200">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {isAtLimit && <p className="mt-2 text-xs text-red-600">Limit reached. Contact support for more quota.</p>}
      {isNearLimit && !isAtLimit && <p className="mt-2 text-xs text-yellow-600">Approaching limit.</p>}
    </div>
  )
}
