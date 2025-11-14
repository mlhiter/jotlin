'use client'

import { ExternalLink, TrendingUp, Users, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CompetitorCardProps {
  name: string
  website?: string
  type: 'direct' | 'indirect' | 'adjacent'
  confidence: number
  reasoning?: string
  description?: string
  logo?: string
  pricing?: string
  targetAudience?: string
}

export function CompetitorCard({
  name,
  website,
  type,
  confidence,
  reasoning,
  description,
  logo,
  pricing,
  targetAudience,
}: CompetitorCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'direct':
        return 'destructive'
      case 'indirect':
        return 'default'
      case 'adjacent':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'direct':
        return 'Direct Competitor'
      case 'indirect':
        return 'Indirect Competitor'
      case 'adjacent':
        return 'Adjacent Product'
      default:
        return type
    }
  }

  const confidencePercent = Math.round(confidence * 100)

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {logo && (
              <img src={logo} alt={`${name} logo`} className="w-10 h-10 rounded object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold truncate">{name}</h3>
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
          </div>

          {/* Type Badge */}
          <Badge variant={getTypeColor(type)}>{getTypeLabel(type)}</Badge>
        </div>

        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence Score</span>
            <span className="font-medium">{confidencePercent}%</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {/* Metadata */}
        {(pricing || targetAudience) && (
          <div className="flex flex-wrap gap-4 pt-2 border-t">
            {pricing && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Pricing:</span>
                <span className="font-medium">{pricing}</span>
              </div>
            )}
            {targetAudience && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Audience:</span>
                <span className="font-medium">{targetAudience}</span>
              </div>
            )}
          </div>
        )}

        {/* Reasoning */}
        {reasoning && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground italic">{reasoning}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
