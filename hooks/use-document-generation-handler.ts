'use client'

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { documentApi } from '@/api/document'
import { useDocumentGeneration } from '@/hooks/use-document-generation'
import {
  createProgressDocuments,
  getDefaultAnalysisDocuments,
  ProgressData,
  DocumentData,
  GenerationStartData,
} from '@/libs/message-signal-processor'
import { config, logger } from '@/libs/config'

export const useDocumentGenerationHandler = () => {
  const queryClient = useQueryClient()
  const {
    state: documentGenerationState,
    startGeneration,
    updateProgress,
    updateDocuments,
    nextDocument,
    completeGeneration,
    setError: setGenerationError,
    reset: resetGeneration,
    forceComplete,
    incrementCreatedCount,
    incrementFailedCount,
  } = useDocumentGeneration()

  const handleProgressUpdate = useCallback(
    (progressData: ProgressData) => {
      updateProgress(progressData)

      // Update documents based on progress
      const progressDocuments = createProgressDocuments(progressData.progress, progressData.message)
      updateDocuments(progressDocuments)

      // Complete analysis phase when progress reaches 100%
      if (progressData.progress >= 100) {
        completeGeneration()
        logger.info('Analysis phase completed, waiting for document generation signal...')
      }
    },
    [updateProgress, updateDocuments, completeGeneration]
  )

  const handleGenerationStart = useCallback(
    (data: GenerationStartData) => {
      logger.info('Document generation started:', data)
      // Initialize with analyzing state
      startGeneration(getDefaultAnalysisDocuments())
    },
    [startGeneration]
  )

  const handleDocumentsGenerated = useCallback(
    async (documentData: DocumentData) => {
      logger.info('Documents generated, starting creation process:', documentData)

      // Validate document data
      if (!documentData.documents || documentData.documents.length === 0) {
        logger.error('No documents received in generation signal')
        setGenerationError('未收到文档数据，生成失败')
        toast.error('未收到文档数据，生成失败')
        return
      }

      // Replace placeholder with real documents
      startGeneration(documentData.documents)

      try {
        await handleDocumentGeneration(documentData.documents, documentData.chatId)
      } catch (docError) {
        logger.error('Document generation failed:', docError)
        const errorMessage = docError instanceof Error ? docError.message : '未知错误'
        setGenerationError('文档创建失败: ' + errorMessage)
        toast.error('文档创建失败: ' + errorMessage)
      }
    },
    [startGeneration, setGenerationError]
  )

  const handleDocumentGeneration = useCallback(
    async (documents: any[], chatId: string) => {
      logger.info('Starting document generation', {
        documentCount: documents.length,
        chatId,
      })

      try {
        let createdCount = 0
        let failedCount = 0

        // Ensure state is properly initialized
        if (documents.length > 0) {
          startGeneration(documents)
          logger.debug('Document generation state initialized', {
            documents: documents.length,
          })
        }

        for (let i = 0; i < documents.length; i++) {
          const doc = documents[i]
          logger.debug('Processing document', { index: i, title: doc.title })

          try {
            // Update progress
            updateProgress({
              progress: Math.round(((i + 1) / documents.length) * 100),
              message: `正在创建文档: ${doc.title}`,
              status: 'creating',
            })

            // Create document with content directly using createFromMarkdown
            const documentResult = await documentApi.createFromMarkdown({
              title: doc.title,
              markdownContent: doc.content,
              parentDocument: null,
              chatId: chatId,
            })

            logger.debug('Document created', {
              documentId: documentResult.id,
              title: doc.title,
            })

            createdCount++
            incrementCreatedCount()

            // Update progress synchronously
            nextDocument()
            logger.debug('Progress updated', {
              currentIndex: i + 1,
              total: documents.length,
            })

            // Add brief delay for UI updates
            await new Promise((resolve) => setTimeout(resolve, config.timeouts.progressUpdate))
          } catch (error) {
            logger.error(`Failed to create document "${doc.title}"`, error)
            failedCount++
            incrementFailedCount()

            // Update progress even on failure to avoid getting stuck
            nextDocument()
            logger.warn('Progress updated after failure', {
              currentIndex: i + 1,
              total: documents.length,
            })

            // Add brief delay for UI updates
            await new Promise((resolve) => setTimeout(resolve, config.timeouts.progressUpdate))
          }
        }

        // Wait for all progress updates to complete
        await new Promise((resolve) => setTimeout(resolve, config.timeouts.stateSync))
        logger.debug('All progress updates completed')

        // Complete generation regardless of success/failure count
        completeGeneration()

        if (createdCount > 0) {
          const successMsg = `成功创建了 ${createdCount} 个文档${failedCount > 0 ? `，${failedCount} 个失败` : ''}`
          toast.success(successMsg)
          logger.info('Document generation completed successfully', {
            createdCount,
            failedCount,
          })

          // Refresh queries
          queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
          queryClient.invalidateQueries({ queryKey: ['documents'] })
          queryClient.invalidateQueries({ queryKey: ['chats'] })
        } else {
          const errorMsg = `文档创建失败，没有成功创建任何文档${failedCount > 0 ? `（${failedCount} 个失败）` : ''}`
          logger.error(errorMsg, { createdCount, failedCount })
          setGenerationError(errorMsg)
          toast.error(errorMsg)
        }
      } catch (error) {
        logger.error('Failed to handle document generation', error)
        setGenerationError('Create documents failed')
        toast.error('Create documents failed')
      }
    },
    [
      startGeneration,
      updateProgress,
      nextDocument,
      completeGeneration,
      incrementCreatedCount,
      incrementFailedCount,
      setGenerationError,
      queryClient,
    ]
  )

  return {
    documentGenerationState,
    resetGeneration,
    forceComplete,
    handleProgressUpdate,
    handleGenerationStart,
    handleDocumentsGenerated,
  }
}
