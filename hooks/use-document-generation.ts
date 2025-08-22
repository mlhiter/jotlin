'use client'

import { useState, useCallback } from 'react'

export interface DocumentGenerationState {
  isGenerating: boolean
  documents: { title: string; content: string; progress?: number }[]
  currentDocumentIndex: number
  error?: string
  overallProgress?: {
    progress: number
    message: string
    status: string
  }
  createdDocumentCount: number
  failedDocumentCount: number
}

export const useDocumentGeneration = () => {
  const [state, setState] = useState<DocumentGenerationState>({
    isGenerating: false,
    documents: [],
    currentDocumentIndex: 0,
    error: undefined,
    overallProgress: undefined,
    createdDocumentCount: 0,
    failedDocumentCount: 0,
  })

  const startGeneration = useCallback((documents: { title: string; content: string; progress?: number }[]) => {
    setState({
      isGenerating: true,
      documents,
      currentDocumentIndex: 0,
      error: undefined,
      overallProgress: undefined,
      createdDocumentCount: 0,
      failedDocumentCount: 0,
    })
  }, [])

  const updateProgress = useCallback((overallProgress: { progress: number; message: string; status: string }) => {
    setState((prev) => ({ ...prev, overallProgress }))
  }, [])

  const updateDocuments = useCallback((documents: { title: string; content: string; progress?: number }[]) => {
    setState((prev) => {
      // 计算当前应该激活的文档索引（基于progress字段）
      let newCurrentIndex = 0
      for (let i = 0; i < documents.length; i++) {
        const progress = documents[i].progress
        if (progress !== undefined && progress > 0 && progress < 100) {
          newCurrentIndex = i
          break
        } else if (progress === 100) {
          newCurrentIndex = i + 1
        }
      }

      return {
        ...prev,
        documents,
        currentDocumentIndex: Math.min(newCurrentIndex, documents.length - 1),
      }
    })
  }, [])

  const nextDocument = useCallback(() => {
    setState((prev) => {
      const newIndex = prev.currentDocumentIndex + 1
      // 确保索引不会超出范围
      if (newIndex <= prev.documents.length) {
        return {
          ...prev,
          currentDocumentIndex: newIndex,
          // 如果到达最后一个文档，标记为完成
          isGenerating: newIndex < prev.documents.length,
        }
      }
      return prev
    })
  }, [])

  const completeGeneration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      currentDocumentIndex: prev.documents.length,
      overallProgress: undefined,
    }))
  }, [])

  const setError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      error,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      documents: [],
      currentDocumentIndex: 0,
      error: undefined,
      overallProgress: undefined,
      createdDocumentCount: 0,
      failedDocumentCount: 0,
    })
  }, [])

  // 添加一个强制完成的方法，用于处理异常情况
  const forceComplete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      currentDocumentIndex: prev.documents.length,
      overallProgress: undefined,
      error: undefined,
    }))
  }, [])

  // 记录文档创建成功
  const incrementCreatedCount = useCallback(() => {
    setState((prev) => ({
      ...prev,
      createdDocumentCount: prev.createdDocumentCount + 1,
    }))
  }, [])

  // 记录文档创建失败
  const incrementFailedCount = useCallback(() => {
    setState((prev) => ({
      ...prev,
      failedDocumentCount: prev.failedDocumentCount + 1,
    }))
  }, [])

  return {
    state,
    startGeneration,
    updateProgress,
    updateDocuments,
    nextDocument,
    completeGeneration,
    setError,
    reset,
    forceComplete,
    incrementCreatedCount,
    incrementFailedCount,
  }
}
