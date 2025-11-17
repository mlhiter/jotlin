'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Check, X, AlertCircle } from 'lucide-react'
import { cn } from '@/libs/utils/utils'

interface FeatureComparison {
  feature: string
  category?: 'table_stakes' | 'differentiator' | 'innovation'
  competitors: {
    [competitorName: string]: {
      support: 'yes' | 'partial' | 'no'
      quality?: number // 1-5 star rating
      notes?: string
    }
  }
}

interface FeatureComparisonTableProps {
  features: FeatureComparison[]
  competitors: string[]
  className?: string
}

export function FeatureComparisonTable({ features, competitors, className }: FeatureComparisonTableProps) {
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'table_stakes':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'differentiator':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'innovation':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const renderSupportIcon = (support: 'yes' | 'partial' | 'no', quality?: number) => {
    if (support === 'yes') {
      return (
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          {quality && (
            <span className="text-sm text-muted-foreground">
              {'⭐'.repeat(quality)}
            </span>
          )}
        </div>
      )
    } else if (support === 'partial') {
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          {quality && (
            <span className="text-sm text-muted-foreground">
              {'⭐'.repeat(quality)}
            </span>
          )}
        </div>
      )
    } else {
      return <X className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className={cn('rounded-md border overflow-x-auto', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px] sticky left-0 bg-background z-10">Feature</TableHead>
            {competitors.map((competitor) => (
              <TableHead key={competitor} className="text-center min-w-[150px]">
                {competitor}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((feature, index) => (
            <TableRow key={index}>
              <TableCell className="sticky left-0 bg-background z-10">
                <div className="space-y-1">
                  <div className="font-medium">{feature.feature}</div>
                  {feature.category && (
                    <Badge variant="outline" className={cn('text-xs', getCategoryColor(feature.category))}>
                      {feature.category.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </TableCell>
              {competitors.map((competitor) => {
                const data = feature.competitors[competitor]
                return (
                  <TableCell key={competitor} className="text-center">
                    {data ? (
                      <div className="flex flex-col items-center gap-1">
                        {renderSupportIcon(data.support, data.quality)}
                        {data.notes && (
                          <span className="text-xs text-muted-foreground">{data.notes}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="p-4 bg-muted/50 border-t">
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium">Legend:</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>Full support</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span>Partial support</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-gray-400" />
              <span>Not available</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⭐</span>
              <span>Quality rating (1-5 stars)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
