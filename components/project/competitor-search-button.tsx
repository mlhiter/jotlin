'use client'

import { Search, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import apiClient from '@/libs/utils/axios'

import type { CompetitorResearchResponse } from '@/types/competitor'

interface CompetitorSearchButtonProps {
  chatId: string
  onSearchComplete?: () => void
  disabled?: boolean
}

export function CompetitorSearchButton({ chatId, onSearchComplete, disabled }: CompetitorSearchButtonProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [searchStatus, setSearchStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle')
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const researchIdRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const pollSearchStatus = async (researchId: string) => {
    try {
      const response = await apiClient.get<CompetitorResearchResponse[]>(`/api/chats/${chatId}/competitor-research`)
      const research = response.data.find((r) => r.id === researchId)

      if (!research) return

      setSearchStatus(research.status)

      if (research.status === 'completed' && research.analysis) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setIsSearching(false)

        const competitorCount = research.analysis?.competitors?.length || 0
        if (competitorCount > 0) {
          toast.success(`Found ${competitorCount} competitors with detailed analysis`)
        } else {
          toast.success('Competitor research completed')
        }

        onSearchComplete?.()
      } else if (research.status === 'failed') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setIsSearching(false)
        toast.error(research.errorMessage || 'Competitor search failed')
      }
    } catch (error) {
      console.error('[CompetitorSearchButton] Poll failed:', error)
    }
  }

  const handleSearch = async () => {
    setIsSearching(true)
    setSearchStatus('pending')

    try {
      const response = await apiClient.post(`/api/chats/${chatId}/competitor-research`)

      researchIdRef.current = response.data.id

      pollIntervalRef.current = setInterval(() => {
        if (researchIdRef.current) {
          pollSearchStatus(researchIdRef.current)
        }
      }, 2000)
    } catch (error: unknown) {
      console.error('[CompetitorSearchButton] Search failed:', error)
      setIsSearching(false)
      setSearchStatus('failed')

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { details?: string } } }
        if (axiosError.response?.status === 429) {
          toast.error('Search rate limit exceeded. Please try again in 1 minute.')
        } else if (axiosError.response?.data?.details) {
          toast.error(`Search failed: ${axiosError.response.data.details}`)
        } else {
          toast.error('Competitor search failed. You can continue without it.')
        }
      } else {
        toast.error('Competitor search failed. Please try again.')
      }
    }
  }

  const getButtonText = () => {
    switch (searchStatus) {
      case 'pending':
        return 'Initializing search...'
      case 'processing':
        return 'Searching competitors...'
      case 'completed':
        return 'Search Completed'
      case 'failed':
        return 'Search Failed'
      default:
        return 'Search Competitors'
    }
  }

  return (
    <Button onClick={handleSearch} disabled={true} variant="outline" size="sm" className="gap-2">
      {isSearching ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {getButtonText()}
        </>
      ) : (
        <>
          <Search className="h-4 w-4" />
          Coming Soon
        </>
      )}
    </Button>
  )
}
