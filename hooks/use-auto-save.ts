'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import apiClient from '@/libs/utils/axios'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveOptions {
  documentId: string
  content: string
  delay?: number
  onSave?: (content: string) => Promise<void>
  initialLastSavedAt?: Date | null
}

export function useAutoSave({
  documentId,
  content,
  delay = 1000,
  onSave,
  initialLastSavedAt = null,
}: UseAutoSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(initialLastSavedAt)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const previousContentRef = useRef<string>(content)

  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const response = await apiClient.patch(`/api/documents/${documentId}`, {
        content: newContent,
      })
      return response.data
    },
    onSuccess: () => {
      setStatus('idle')
      setLastSavedAt(new Date())
      previousContentRef.current = content
    },
    onError: (error) => {
      console.error('Auto-save error:', error)
      setStatus('error')

      setTimeout(() => {
        setStatus('idle')
      }, 3000)
    },
  })

  useEffect(() => {
    if (content === previousContentRef.current) {
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      if (onSave) {
        onSave(content)
      } else {
        saveMutation.mutate(content)
      }
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [content, delay, documentId])

  const saveNow = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (content !== previousContentRef.current) {
      if (onSave) {
        onSave(content)
      } else {
        saveMutation.mutate(content)
      }
    }
  }

  return {
    status,
    lastSavedAt,
    saveNow,
    isSaving: status === 'saving',
  }
}
