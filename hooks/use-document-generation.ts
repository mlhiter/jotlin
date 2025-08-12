'use client'

import { useState, useCallback } from 'react'

export interface DocumentGenerationState {
  isGenerating: boolean
  documents: { title: string; content: string }[]
  currentDocumentIndex: number
  error?: string
  overallProgress?: {
    progress: number
    message: string
    status: string
  }
}

export const useDocumentGeneration = () => {
  const [state, setState] = useState<DocumentGenerationState>({
    isGenerating: false,
    documents: [],
    currentDocumentIndex: 0,
    error: undefined,
    overallProgress: undefined,
  })

  const startGeneration = useCallback(
    (documents: { title: string; content: string }[]) => {
      setState({
        isGenerating: true,
        documents,
        currentDocumentIndex: 0,
        error: undefined,
        overallProgress: undefined,
      })
    },
    []
  )

  const updateProgress = useCallback(
    (overallProgress: {
      progress: number
      message: string
      status: string
    }) => {
      setState((prev) => ({ ...prev, overallProgress }))
    },
    []
  )

  const nextDocument = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentDocumentIndex: prev.currentDocumentIndex + 1,
    }))
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
    })
  }, [])

  return {
    state,
    startGeneration,
    updateProgress,
    nextDocument,
    completeGeneration,
    setError,
    reset,
  }
}
