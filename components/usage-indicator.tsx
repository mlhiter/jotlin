'use client'

import { useMessageLimits } from '@/hooks/use-message-limits'

export function UsageIndicator() {
  const { usage, isLoading, error, refreshUsage } = useMessageLimits()

  if (error) {
    return (
      <div className="bg-muted/20 rounded-lg border border-border/40 p-3 transition-all duration-150">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">Usage Error</span>
          <button
            onClick={refreshUsage}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors duration-150">
            Retry
          </button>
        </div>
        <p className="text-muted-foreground/70 mt-1 text-xs">Failed to load usage data</p>
      </div>
    )
  }

  if (isLoading || !usage) {
    return (
      <div className="bg-muted/20 animate-pulse rounded-lg border border-border/40 p-3">
        <div className="bg-muted/40 mb-2 h-4 w-24 rounded"></div>
        <div className="bg-muted/40 h-2 w-full rounded"></div>
      </div>
    )
  }

  const percentage = (usage.currentCount / usage.limit) * 100
  const isNearLimit = percentage > 80
  const isAtLimit = usage.currentCount >= usage.limit

  return (
    <div
      className={`rounded-lg border p-3 transition-all duration-150 ${
        isAtLimit || isNearLimit ? 'border-border/40 bg-muted/40' : 'border-border/40 bg-muted/20'
      }`}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">Message Limits</span>
        <span className="text-muted-foreground font-mono text-xs">
          {usage.currentCount.toLocaleString()}/{usage.limit.toLocaleString()}
        </span>
      </div>

      <div className="bg-muted/40 h-1.5 w-full rounded-full">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {isAtLimit && (
        <p className="text-muted-foreground/70 mt-2 text-xs">Limit reached. Contact support for more quota.</p>
      )}
      {isNearLimit && !isAtLimit && <p className="text-muted-foreground/70 mt-2 text-xs">Approaching limit.</p>}
    </div>
  )
}
