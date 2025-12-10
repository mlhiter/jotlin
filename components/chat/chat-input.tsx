'use client'

import { ChatPhase } from '@prisma/client'
import { ChatStatus } from 'ai'
import { ArrowUp, Square, X, TextAlignStart, Image as ImageIcon, Target, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { toast } from 'sonner'

import { FilePreview } from '@/components/chat/file-preview'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { useSelectedOptions } from '@/hooks/use-selected-options'
import apiClient from '@/libs/utils/axios'
import { validateFile, extractFileContent, isImageFile } from '@/libs/utils/file-utils'

import type { Quote, SelectedOption } from '@/types/chat'
import type { CompetitorResearchResponse } from '@/types/competitor'

interface ChatInputProps {
  onSendMessage: (message: { text: string }) => void
  onStop: () => void
  status: ChatStatus
  disabled?: boolean
  quotes?: Quote[]
  onAddQuote?: (quote: Quote) => void
  onRemoveQuote?: (id: string) => void
  onMarkMessageAnswered?: (messageId: string, selectedOptions: SelectedOption[]) => void
  autoFocus?: boolean
  chatId?: string
  phase?: ChatPhase | null
  onCompetitorSearchComplete?: () => void
}

export function ChatInput({
  onSendMessage,
  onStop,
  status,
  disabled = false,
  quotes = [],
  onRemoveQuote,
  onMarkMessageAnswered,
  autoFocus = false,
  chatId,
  phase,
  onCompetitorSearchComplete,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<FileList | undefined>(undefined)
  const [isSearchingCompetitors, setIsSearchingCompetitors] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { selectedOptions, clearOptions, removeOption, currentAssistantMessageId } = useSelectedOptions()

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    const maxFiles = 3

    const currentFileCount = files?.length || 0
    if (currentFileCount + selectedFiles.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files at once`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate all files
    let allValid = true
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const validation = validateFile(file)
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`)
        allValid = false
        break
      }
    }

    if (!allValid) {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setFiles(selectedFiles)
  }

  const handleRemoveFile = () => {
    setFiles(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      (!input.trim() && selectedOptions.length === 0 && !files) ||
      status === 'submitted' ||
      status === 'streaming' ||
      disabled
    )
      return

    let messageText = ''

    if (selectedOptions.length > 0) {
      const selectedTexts = selectedOptions.map((option) => option.value).join(',')
      messageText = selectedTexts

      if (currentAssistantMessageId) {
        onMarkMessageAnswered?.(currentAssistantMessageId, selectedOptions)
      }
    }

    if (quotes.length > 0) {
      const quotesText = quotes.map((quote) => `<quote>${quote.text}</quote>`).join('\n')
      messageText = quotesText + (messageText ? '\n\n' + messageText : '') + (input.trim() ? '\n\n' + input : '')
    } else if (input.trim()) {
      messageText = messageText ? messageText + '\n\n' + input : input
    }

    // Extract file contents (images only)
    if (files && files.length > 0) {
      try {
        const fileContents: string[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          try {
            const { content } = await extractFileContent(file)

            if (isImageFile(file)) {
              // For images, add a user-friendly marker (the model will see the base64)
              fileContents.push(`[Image: ${file.name}]\n${content}`)
            }
          } catch (error) {
            console.error(`Failed to extract content from ${file.name}:`, error)
            toast.error(`Failed to read ${file.name}`)
          }
        }

        if (fileContents.length > 0) {
          const filesText = fileContents.join('\n\n---\n\n')
          messageText = messageText ? `${filesText}\n\n${messageText}` : filesText
        }
      } catch (error) {
        console.error('Failed to process files:', error)
        toast.error('Failed to process files')
        return
      }
    }

    onSendMessage({
      text: messageText || 'Hello',
    })

    setInput('')
    setFiles(undefined)
    clearOptions()

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleStop = () => {
    onStop()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleCompetitorSearch = async () => {
    if (!chatId) return

    setIsSearchingCompetitors(true)
    try {
      const response = await apiClient.post(`/api/chats/${chatId}/competitor-research`)
      const researchId = response.data.id

      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollResponse = await apiClient.get<CompetitorResearchResponse[]>(
            `/api/chats/${chatId}/competitor-research`
          )
          const research = pollResponse.data.find((r) => r.id === researchId)

          if (!research) return

          if (research.status === 'completed' && research.analysis) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            setIsSearchingCompetitors(false)

            const competitorCount = research.analysis?.competitors?.length || 0
            if (competitorCount > 0) {
              toast.success(`Found ${competitorCount} competitors`)
            } else {
              toast.success('Research completed')
            }

            onCompetitorSearchComplete?.()
          } else if (research.status === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            setIsSearchingCompetitors(false)
            toast.error(research.errorMessage || 'Search failed')
          }
        } catch (error) {
          console.error('Poll failed:', error)
        }
      }, 2000)
    } catch (error) {
      console.error('Competitor search failed:', error)
      setIsSearchingCompetitors(false)
      toast.error('Failed to start search')
    }
  }

  return (
    <div className="mb-2 mt-1 px-4">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        {files && files.length > 0 && (
          <div className="mb-2 flex flex-col gap-2">
            {Array.from(files).map((file, index) => (
              <FilePreview key={`${file.name}-${index}`} file={file} preview="" onRemove={handleRemoveFile} />
            ))}
          </div>
        )}

        {quotes.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-muted/20 border-border/40 flex w-48 items-center gap-1 rounded-md border px-2 py-1 transition-all duration-150">
                <TextAlignStart className="text-accent-foreground/70 h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
                <div className="text-muted-foreground flex-1 truncate text-xs">{quote.text}</div>
                {onRemoveQuote && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveQuote(quote.id)}
                    className="h-4 w-4 p-0">
                    <X className="h-3 w-3 text-neutral-500" strokeWidth={1.5} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedOptions.length > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-muted-foreground text-xs">Selected options:</div>
              <div className="flex flex-wrap gap-2">
                {selectedOptions.map((option, index) => (
                  <div
                    key={`${option.value}-${index}`}
                    className="bg-accent/40 border-border/40 flex items-center gap-2 rounded-md border px-2 py-1 text-sm transition-all duration-150">
                    <span className="text-muted-foreground text-xs font-medium">{option.value}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeOption(option.value)}
                      className="h-4 w-4 p-0">
                      <X className="h-3 w-3 text-neutral-500" strokeWidth={1.5} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearOptions}
              className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs">
              Clear all
            </Button>
          </div>
        )}

        <div
          className="border-input focus-within:ring-ring/50 focus-within:border-ring flex flex-col overflow-hidden rounded-lg border bg-transparent shadow-sm transition-all focus-within:ring-[3px]"
          onClick={() => textareaRef.current?.focus()}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <TextareaAutosize
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Jotlin Agent..."
            disabled={status === 'submitted' || status === 'streaming' || disabled}
            minRows={2}
            maxRows={8}
            className="custom-scrollbar placeholder:text-muted-foreground outline-none! w-full resize-none border-0 bg-transparent px-3 pt-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          />

          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      disabled={
                        status === 'submitted' || status === 'streaming' || disabled || (files && files.length >= 3)
                      }
                      className="h-8 w-8 p-0"
                      aria-label="Upload image">
                      <ImageIcon className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Upload Image</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {chatId && phase === 'REQUIREMENT' && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCompetitorSearch()
                        }}
                        disabled={isSearchingCompetitors}
                        className="h-8 w-8 p-0"
                        aria-label="Search competitors">
                        {isSearchingCompetitors ? (
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                        ) : (
                          <Target className="h-4 w-4" strokeWidth={1.5} />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Search Competitors</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <Button
              type={status === 'streaming' ? 'button' : 'submit'}
              onClick={(e) => {
                e.stopPropagation()
                if (status === 'streaming') {
                  handleStop()
                }
              }}
              disabled={status !== 'streaming' && !input.trim() && selectedOptions.length === 0 && !files}
              size="sm"
              className="h-8 w-8 p-0">
              {status === 'streaming' ? (
                <Square className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <ArrowUp className="h-4 w-4" strokeWidth={1.5} />
              )}
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-muted-foreground text-xs">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </form>
    </div>
  )
}
