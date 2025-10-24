'use client'

import { useMessageLimits } from '@/hooks/use-message-limits'

export function UsageIndicator() {
  const { usage, isLoading, error, refreshUsage } = useMessageLimits()

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-red-700 dark:text-red-300">Usage Error</span>
          <button onClick={refreshUsage} className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
            Retry
          </button>
        </div>
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">Failed to load usage data</p>
      </div>
    )
  }

  if (isLoading || !usage) {
    return (
      <div className="animate-pulse rounded-lg bg-muted/50 p-3">
        <div className="mb-2 h-4 w-24 rounded bg-muted"></div>
        <div className="h-2 w-full rounded bg-muted"></div>
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
          ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20'
          : isNearLimit
            ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950/20'
            : 'border-border bg-muted/30'
      }`}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Message Limits</span>
        <span
          className={`font-mono text-xs ${
            isAtLimit ? 'text-red-600 dark:text-red-400' : isNearLimit ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'
          }`}>
          {usage.currentCount.toLocaleString()}/{usage.limit.toLocaleString()}
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            isAtLimit ? 'bg-red-500 dark:bg-red-600' : isNearLimit ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-primary'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {isAtLimit && <p className="mt-2 text-xs text-red-600 dark:text-red-400">Limit reached. Contact support for more quota.</p>}
      {isNearLimit && !isAtLimit && <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">Approaching limit.</p>}
    </div>
  )
}
