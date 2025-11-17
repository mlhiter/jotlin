'use client'

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Label } from 'recharts'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CompetitorPosition {
  name: string
  x: number // 0-1 scale
  y: number // 0-1 scale
  type?: 'direct' | 'indirect' | 'adjacent' | 'you'
  description?: string
}

interface PositioningMapProps {
  competitors: CompetitorPosition[]
  axes?: {
    x?: { left: string; right: string }
    y?: { bottom: string; top: string }
  }
  className?: string
}

const defaultAxes = {
  x: { left: 'Simple', right: 'Powerful' },
  y: { bottom: 'Individual', top: 'Team' },
}

export function PositioningMap({ competitors, axes = defaultAxes, className }: PositioningMapProps) {
  const getCompetitorColor = (type?: string) => {
    switch (type) {
      case 'direct':
        return '#ef4444' // red
      case 'indirect':
        return '#f59e0b' // orange
      case 'adjacent':
        return '#3b82f6' // blue
      case 'you':
        return '#10b981' // green
      default:
        return '#6b7280' // gray
    }
  }

  const getCompetitorSize = (type?: string) => {
    return type === 'you' ? 400 : 200
  }

  // Transform data for recharts (scale to 0-100 for better visualization)
  const data = competitors.map((c) => ({
    ...c,
    x: c.x * 100,
    y: c.y * 100,
    size: getCompetitorSize(c.type),
    fill: getCompetitorColor(c.type),
  }))

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Competitive Positioning Map</h3>
          <p className="text-sm text-muted-foreground">
            Visual representation of how competitors position themselves in the market
          </p>
        </div>

        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 60,
                left: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                type="number"
                dataKey="x"
                name="x-axis"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={() => ''}
              >
                <Label
                  value={axes.x?.left || defaultAxes.x.left}
                  position="insideBottomLeft"
                  offset={-40}
                  style={{ textAnchor: 'start', fill: '#6b7280', fontSize: 12 }}
                />
                <Label
                  value={axes.x?.right || defaultAxes.x.right}
                  position="insideBottomRight"
                  offset={-40}
                  style={{ textAnchor: 'end', fill: '#6b7280', fontSize: 12 }}
                />
              </XAxis>

              <YAxis
                type="number"
                dataKey="y"
                name="y-axis"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={() => ''}
              >
                <Label
                  value={axes.y?.bottom || defaultAxes.y.bottom}
                  position="insideBottomLeft"
                  angle={-90}
                  offset={-40}
                  style={{ textAnchor: 'end', fill: '#6b7280', fontSize: 12 }}
                />
                <Label
                  value={axes.y?.top || defaultAxes.y.top}
                  position="insideTopLeft"
                  angle={-90}
                  offset={-40}
                  style={{ textAnchor: 'start', fill: '#6b7280', fontSize: 12 }}
                />
              </YAxis>

              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as CompetitorPosition & { fill: string }
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-semibold">{data.name}</p>
                        {data.type && (
                          <Badge variant="outline" className="mt-1">
                            {data.type}
                          </Badge>
                        )}
                        {data.description && (
                          <p className="text-sm text-muted-foreground mt-2">{data.description}</p>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />

              <Scatter name="Competitors" data={data} fill="#8884d8">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm">Direct Competitor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm">Indirect Competitor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm">Adjacent Competitor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm font-semibold">Your Product</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
