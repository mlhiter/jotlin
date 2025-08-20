'use client'

import {
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '@/libs/utils'

export interface DocumentGenerationProgressProps {
  documents: { title: string; content: string }[]
  currentDocumentIndex: number
  isGenerating: boolean
  error?: string
  overallProgress?: {
    progress: number
    message: string
    status: string
  }
}

const DocumentGenerationProgress = ({
  documents,
  currentDocumentIndex,
  isGenerating,
  error,
  overallProgress,
}: DocumentGenerationProgressProps) => {
  const [animatedIndex, setAnimatedIndex] = useState(-1)

  useEffect(() => {
    if (currentDocumentIndex >= 0 && currentDocumentIndex < documents.length) {
      const timer = setTimeout(() => {
        setAnimatedIndex(currentDocumentIndex)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentDocumentIndex, documents.length])

  if (documents.length === 0) return null

  // Check if we're in analysis phase (placeholder documents) or creation phase (real documents)
  const isAnalysisPhase = documents.some(
    (doc) =>
      doc.title.includes('正在分析') ||
      doc.title.includes('生成需求文档') ||
      doc.title.includes('创建文档结构')
  )

  return (
    <div className="space-y-3 rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:from-blue-950/20 dark:to-purple-950/20">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
        <FileText className="h-4 w-4" />
        <span>{isAnalysisPhase ? '分析需求生成文档' : '创建需求文档'}</span>
        {isGenerating && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>

      {isAnalysisPhase && overallProgress && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-md bg-blue-100 p-3 dark:bg-blue-950/30">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {overallProgress.message}
                </p>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {overallProgress.progress}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-blue-200 dark:bg-blue-800">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300 dark:bg-blue-400"
                  style={{ width: `${overallProgress.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isAnalysisPhase && (
        <div className="space-y-2">
          {documents.map((doc, index) => {
            const isCompleted = index < currentDocumentIndex
            const isCurrent = index === currentDocumentIndex && isGenerating
            const isPending = index > currentDocumentIndex

            return (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-3 rounded-md p-2 transition-all duration-300',
                  isCompleted && 'bg-green-50 dark:bg-green-950/20',
                  isCurrent && 'bg-blue-100 dark:bg-blue-950/30',
                  isPending && 'bg-gray-50 dark:bg-gray-800/30'
                )}>
                <div className="flex-shrink-0">
                  {isCompleted && (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                  {isCurrent && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  )}
                  {isPending && <Clock className="h-4 w-4 text-gray-400" />}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm font-medium',
                      isCompleted && 'text-green-700 dark:text-green-300',
                      isCurrent && 'text-blue-700 dark:text-blue-300',
                      isPending && 'text-gray-500 dark:text-gray-400'
                    )}>
                    {doc.title}
                  </p>
                  {isCurrent && (
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      正在创建文档...
                    </p>
                  )}
                  {isCompleted && (
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                      ✓ 已创建
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isGenerating && !error && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-2 text-sm text-green-600 dark:bg-green-950/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>所有文档已成功创建！点击侧边栏查看</span>
        </div>
      )}
    </div>
  )
}

export default DocumentGenerationProgress
