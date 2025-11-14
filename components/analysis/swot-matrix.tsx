'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react'

interface SWOTMatrixProps {
  competitor: string
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

export function SWOTMatrix({
  competitor,
  strengths,
  weaknesses,
  opportunities,
  threats,
}: SWOTMatrixProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{competitor} - SWOT Analysis</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h4 className="font-semibold text-green-900 dark:text-green-100">Strengths</h4>
          </div>
          <ul className="space-y-2">
            {strengths.map((item, index) => (
              <li key={index} className="text-sm text-green-800 dark:text-green-200 flex gap-2">
                <span className="text-green-600 dark:text-green-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Weaknesses */}
        <Card className="p-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h4 className="font-semibold text-red-900 dark:text-red-100">Weaknesses</h4>
          </div>
          <ul className="space-y-2">
            {weaknesses.map((item, index) => (
              <li key={index} className="text-sm text-red-800 dark:text-red-200 flex gap-2">
                <span className="text-red-600 dark:text-red-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Opportunities */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Opportunities</h4>
          </div>
          <ul className="space-y-2">
            {opportunities.map((item, index) => (
              <li key={index} className="text-sm text-blue-800 dark:text-blue-200 flex gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Threats */}
        <Card className="p-6 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h4 className="font-semibold text-orange-900 dark:text-orange-100">Threats</h4>
          </div>
          <ul className="space-y-2">
            {threats.map((item, index) => (
              <li key={index} className="text-sm text-orange-800 dark:text-orange-200 flex gap-2">
                <span className="text-orange-600 dark:text-orange-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
