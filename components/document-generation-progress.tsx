'use client'

import { CheckCircle, Clock, FileText, Loader2, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '@/libs/utils'

export interface DocumentGenerationProgressProps {
  documents: { title: string; content: string; progress?: number }[]
  currentDocumentIndex: number
  isGenerating: boolean
  error?: string
  overallProgress?: {
    progress: number
    message: string
    status: string
  }
  createdDocumentCount?: number
  failedDocumentCount?: number
}

const DocumentGenerationProgress = ({
  documents,
  currentDocumentIndex,
  isGenerating,
  error,
  overallProgress,
  createdDocumentCount = 0,
  failedDocumentCount = 0,
}: DocumentGenerationProgressProps) => {
  const [animatedIndex, setAnimatedIndex] = useState(-1)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (currentDocumentIndex >= 0 && currentDocumentIndex < documents.length) {
      const timer = setTimeout(() => {
        setAnimatedIndex(currentDocumentIndex)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentDocumentIndex, documents.length])

  // 添加超时保护，防止进度卡住
  useEffect(() => {
    if (isGenerating && documents.length > 0) {
      // 设置5分钟超时
      const timeout = setTimeout(
        () => {
          console.warn('Document generation timeout detected, forcing completion')
          // 这里可以触发一个回调来强制完成
        },
        5 * 60 * 1000
      )

      setTimeoutId(timeout)

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }
  }, [isGenerating, documents.length])

  // 清理超时定时器
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  if (documents.length === 0) return null

  // Check if we're in analysis phase (placeholder documents) or creation phase (real documents)
  const isAnalysisPhase = documents.some(
    (doc) =>
      doc.title.includes('识别最终用户和利益相关者') ||
      doc.title.includes('进行用户访谈和收集需求') ||
      doc.title.includes('分析部署环境和约束') ||
      doc.title.includes('分析需求并生成用例模型') ||
      doc.title.includes('生成IEEE 29148兼容的SRS文档') ||
      doc.title.includes('进行SRS文档质量审查')
  )

  // 计算实际进度百分比
  const actualProgress = documents.length > 0 ? Math.round((currentDocumentIndex / documents.length) * 100) : 0

  return (
    <div className="space-y-4 rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-5 shadow-sm dark:border-blue-800/50 dark:from-blue-950/30 dark:via-gray-950 dark:to-purple-950/30">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">文档生成进度</h3>
        </div>
        <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          {actualProgress}% ({currentDocumentIndex}/{documents.length})
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-blue-200/50 dark:bg-blue-800/50">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-sm transition-all duration-700 ease-out"
          style={{ width: `${actualProgress}%` }}
        />
      </div>

      {/* Overall Progress Information */}
      {overallProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-blue-800 dark:text-blue-200">整体进度</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{overallProgress.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200/50 dark:bg-blue-800/50">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${overallProgress.progress}%` }}
            />
          </div>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{overallProgress.message}</p>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                overallProgress.status === 'running' && 'animate-pulse bg-blue-500',
                overallProgress.status === 'completed' && 'bg-green-500',
                overallProgress.status === 'failed' && 'bg-red-500'
              )}
            />
            <span className="text-xs capitalize text-blue-600 dark:text-blue-400">
              {overallProgress.status === 'running'
                ? '进行中'
                : overallProgress.status === 'completed'
                  ? '已完成'
                  : overallProgress.status === 'failed'
                    ? '失败'
                    : overallProgress.status}
            </span>
          </div>
        </div>
      )}

      {/* Analysis Phase */}
      {isAnalysisPhase && (
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg border border-blue-200/50 bg-gradient-to-r from-blue-50 to-blue-100 p-3 dark:border-blue-800/50 dark:from-blue-950/40 dark:to-blue-900/40">
              <div className="mt-0.5 flex-shrink-0">
                {doc.progress && doc.progress >= 100 ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{doc.title}</p>
                {doc.progress !== undefined && doc.progress > 0 && doc.progress < 100 && (
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-blue-200/50 dark:bg-blue-800/50">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm transition-all duration-500 ease-out"
                        style={{ width: `${doc.progress}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{doc.progress}% 完成</p>
                  </div>
                )}
                {doc.progress === 100 && (
                  <p className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    已完成
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Creation Phase */}
      {!isAnalysisPhase && (
        <div className="space-y-3">
          {documents.map((doc, index) => {
            const isCompleted = index < currentDocumentIndex
            const isCurrent = index === currentDocumentIndex && isGenerating
            const isPending = index > currentDocumentIndex

            return (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 transition-all duration-300',
                  isCompleted &&
                    'border-green-200/50 bg-gradient-to-r from-green-50 to-green-100 dark:border-green-800/50 dark:from-green-950/40 dark:to-green-900/40',
                  isCurrent &&
                    'border-blue-200/50 bg-gradient-to-r from-blue-50 to-blue-100 dark:border-blue-800/50 dark:from-blue-950/40 dark:to-blue-900/40',
                  isPending &&
                    'border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100 dark:border-gray-800/50 dark:from-gray-950/40 dark:to-gray-900/40'
                )}>
                <div className="mt-0.5 flex-shrink-0">
                  {isCompleted && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
                  {isCurrent && <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />}
                  {isPending && <Clock className="h-4 w-4 text-gray-400" />}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCompleted && 'text-green-800 dark:text-green-200',
                      isCurrent && 'text-blue-800 dark:text-blue-200',
                      isPending && 'text-gray-600 dark:text-gray-300'
                    )}>
                    {doc.title}
                  </p>
                  {isCurrent && <p className="text-xs font-medium text-blue-600 dark:text-blue-400">正在创建文档...</p>}
                  {isCompleted && (
                    <p className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      已创建
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200/50 bg-gradient-to-r from-red-50 to-red-100 p-3 text-sm text-red-700 dark:border-red-800/50 dark:from-red-950/40 dark:to-red-900/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Success/Completion Message */}
      {!isGenerating && !error && currentDocumentIndex >= documents.length && (
        <div>
          {createdDocumentCount > 0 && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-green-200/50 bg-gradient-to-r from-green-50 to-green-100 p-3 text-sm text-green-700 dark:border-green-800/50 dark:from-green-950/40 dark:to-green-900/40 dark:text-green-300">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">已成功创建 {createdDocumentCount} 个文档！点击侧边栏查看</span>
            </div>
          )}
          {failedDocumentCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200/50 bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 text-sm text-yellow-700 dark:border-yellow-800/50 dark:from-yellow-950/40 dark:to-yellow-900/40 dark:text-yellow-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{failedDocumentCount} 个文档创建失败，请检查日志或重试</span>
            </div>
          )}
          {createdDocumentCount === 0 && failedDocumentCount === 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200/50 bg-gradient-to-r from-red-50 to-red-100 p-3 text-sm text-red-700 dark:border-red-800/50 dark:from-red-950/40 dark:to-red-900/40 dark:text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">文档创建失败，没有成功创建任何文档</span>
            </div>
          )}
        </div>
      )}

      {/* Timeout Warning */}
      {timeoutId && isGenerating && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200/50 bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 text-sm text-yellow-700 dark:border-yellow-800/50 dark:from-yellow-950/40 dark:to-yellow-900/40 dark:text-yellow-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">文档生成时间较长，请耐心等待...</span>
        </div>
      )}
    </div>
  )
}

export default DocumentGenerationProgress
