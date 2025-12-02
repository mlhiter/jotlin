'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  GenerationProgressDialog,
  DEFAULT_GENERATION_STEPS,
} from '@/components/chat/generation-progress-dialog'
import apiClient from '@/libs/utils/axios'

interface GenerateDocumentsButtonProps {
  chatId: string
  requirementMessageId?: string
  onGenerated?: () => void
  disabled?: boolean
}

export function GenerateDocumentsButton({
  chatId,
  requirementMessageId,
  onGenerated,
  disabled,
}: GenerateDocumentsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [steps, setSteps] = useState(DEFAULT_GENERATION_STEPS)
  const [currentStep, setCurrentStep] = useState(0)

  const handleGenerate = async () => {
    if (!requirementMessageId) {
      toast.error('No requirement document found. Please complete the requirement analysis first.')
      return
    }

    setIsGenerating(true)
    setSteps(DEFAULT_GENERATION_STEPS.map((s) => ({ ...s, status: 'pending' as const })))
    setCurrentStep(0)

    try {
      // Simulate step-by-step generation (in reality, API does it in one call)
      // Step 1: PRD
      setSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, status: 'processing' } : s)))
      setCurrentStep(1)

      const response = await apiClient.post(
        `/api/chats/${chatId}/generate-documents`,
        {
          requirementMessageId,
        },
        {
          timeout: 120000, // 2 minutes timeout for document generation
        }
      )

      if (response.status !== 200) {
        throw new Error(response.data?.details || 'Failed to generate documents')
      }

      // Simulate progress for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, status: 'completed' } : s)))

      // Step 2: Flowchart
      setSteps((prev) => prev.map((s, i) => (i === 1 ? { ...s, status: 'processing' } : s)))
      setCurrentStep(2)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSteps((prev) => prev.map((s, i) => (i === 1 ? { ...s, status: 'completed' } : s)))

      // Step 3: Sitemap
      setSteps((prev) => prev.map((s, i) => (i === 2 ? { ...s, status: 'processing' } : s)))
      setCurrentStep(3)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSteps((prev) => prev.map((s, i) => (i === 2 ? { ...s, status: 'completed' } : s)))

      // Step 4: Wireframe
      setSteps((prev) => prev.map((s, i) => (i === 3 ? { ...s, status: 'processing' } : s)))
      setCurrentStep(4)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSteps((prev) => prev.map((s, i) => (i === 3 ? { ...s, status: 'completed' } : s)))

      toast.success('Documents generated successfully!')

      // Close dialog after a brief delay
      setTimeout(() => {
        setIsGenerating(false)
        if (onGenerated) {
          onGenerated()
        }
      }, 1000)
    } catch (error) {
      console.error('Generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate documents')
      setSteps((prev) =>
        prev.map((s, i) => (i === currentStep - 1 ? { ...s, status: 'error' } : s))
      )

      // Close dialog after error
      setTimeout(() => {
        setIsGenerating(false)
      }, 2000)
    }
  }

  return (
    <>
      <Button
        onClick={handleGenerate}
        disabled={disabled || isGenerating || !requirementMessageId}
        className="w-full gap-2"
        variant="default"
        size="lg">
        <Sparkles className="h-4 w-4" />
        Generate PRD & Design Documents
      </Button>

      <GenerationProgressDialog
        open={isGenerating}
        steps={steps}
        currentStep={currentStep}
        totalSteps={4}
      />
    </>
  )
}
