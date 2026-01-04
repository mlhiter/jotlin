'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { Bot, Plus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { SaveStatus } from '@/hooks/use-auto-save'
import apiClient from '@/libs/utils/axios'

import { AutoSaveIndicator } from './auto-save-indicator'

import type { Document } from '@/types/document'

interface DocumentHeaderProps {
  documentId: string
  title: string
  documentType: string
  icon?: string
  isAIGenerated?: boolean
  saveStatus: SaveStatus
  lastSavedAt: Date | null
  currentTab?: string
  onTabChange?: (tab: string) => void
  projectInfo?: {
    title: string
    icon?: string
  }
}

const BUILT_IN_TYPES = ['PRD', 'PAR', 'User Stories', 'Flows', 'Wireframe', 'Sitemap']

export function DocumentHeader({
  documentId,
  title: propTitle,
  documentType: propDocumentType,
  icon: propIcon,
  isAIGenerated,
  saveStatus,
  lastSavedAt,
  currentTab,
  onTabChange,
  projectInfo,
}: DocumentHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(propTitle)
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [editedLabel, setEditedLabel] = useState(propDocumentType)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Local optimistic state
  const [localTitle, setLocalTitle] = useState(propTitle)
  const [localDocumentType, setLocalDocumentType] = useState(propDocumentType)
  const [localIcon, setLocalIcon] = useState(propIcon)

  const titleInputRef = useRef<HTMLInputElement>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Sync with props when they change from server
  useEffect(() => {
    setLocalTitle(propTitle)
  }, [propTitle])

  useEffect(() => {
    setLocalDocumentType(propDocumentType)
  }, [propDocumentType])

  useEffect(() => {
    setLocalIcon(propIcon)
  }, [propIcon])

  const updateMutation = useMutation({
    mutationFn: async (data: { title?: string; documentType?: string; icon?: string }) => {
      const response = await apiClient.patch(`/api/documents/${documentId}`, data)
      return response.data
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['document', documentId] })
      await queryClient.cancelQueries({ queryKey: ['documents'] })

      // Snapshot previous value
      const previousDocument = queryClient.getQueryData(['document', documentId])
      const previousDocuments = queryClient.getQueryData(['documents'])

      // Optimistically update document
      queryClient.setQueryData(['document', documentId], (old: Document[] | undefined) => {
        if (!old) return old
        return { ...old, ...newData }
      })

      // Optimistically update documents list
      queryClient.setQueriesData({ queryKey: ['documents'] }, (old: Document[]) => {
        if (!old) return old
        if (Array.isArray(old)) {
          return old.map((doc: Document) => (doc.id === documentId ? { ...doc, ...newData } : doc))
        }
        return old
      })

      return { previousDocument, previousDocuments }
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousDocument) {
        queryClient.setQueryData(['document', documentId], context.previousDocument)
      }
      if (context?.previousDocuments) {
        queryClient.setQueryData(['documents'], context.previousDocuments)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus()
      labelInputRef.current.select()
    }
  }, [isEditingLabel])

  const handleTitleClick = () => {
    setEditedTitle(localTitle)
    setIsEditingTitle(true)
  }

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== localTitle) {
      setLocalTitle(editedTitle.trim()) // Immediate local update
      updateMutation.mutate({ title: editedTitle.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setEditedTitle(localTitle)
      setIsEditingTitle(false)
    }
  }

  const handleLabelSave = () => {
    if (editedLabel.trim() && editedLabel !== localDocumentType) {
      setLocalDocumentType(editedLabel.trim()) // Immediate local update
      updateMutation.mutate({ documentType: editedLabel.trim() })
    }
    setIsEditingLabel(false)
  }

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSave()
    } else if (e.key === 'Escape') {
      setEditedLabel(localDocumentType)
      setIsEditingLabel(false)
    }
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setLocalIcon(emojiData.emoji) // Immediate local update
    updateMutation.mutate({ icon: emojiData.emoji })
    setShowEmojiPicker(false)
  }

  const isBuiltInType = BUILT_IN_TYPES.includes(localDocumentType)

  // Show project info in Chat tab, document info in Editor tab
  const displayIcon = projectInfo ? projectInfo.icon || '📁' : localIcon || '📄'
  const displayTitle = projectInfo ? projectInfo.title : localTitle
  const showDocumentBadges = !projectInfo

  return (
    <div className="flex items-center justify-between px-6 py-2">
      <div className="flex items-center gap-2">
        {projectInfo ? (
          // Non-editable icon for project
          <div className="text-lg">{displayIcon}</div>
        ) : (
          // Editable icon for document
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <button className="text-lg transition-transform hover:scale-110">{displayIcon}</button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" side="bottom" align="start">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </PopoverContent>
          </Popover>
        )}

        <div className="flex items-center gap-2">
          {projectInfo ? (
            // Non-editable title for project
            <h1 className="text-base font-semibold">{displayTitle}</h1>
          ) : (
            // Editable title for document
            <>
              {isEditingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="h-7 w-64 text-base font-semibold"
                />
              ) : (
                <h1
                  className="hover:text-muted-foreground cursor-pointer text-base font-semibold"
                  onClick={handleTitleClick}>
                  {displayTitle}
                </h1>
              )}
            </>
          )}

          {showDocumentBadges && (
            <>
              {isBuiltInType ? (
                <Badge variant="secondary" className="h-5 px-2 text-xs">
                  {localDocumentType}
                </Badge>
              ) : (
                <>
                  {isEditingLabel ? (
                    <Input
                      ref={labelInputRef}
                      value={editedLabel}
                      onChange={(e) => setEditedLabel(e.target.value)}
                      onBlur={handleLabelSave}
                      onKeyDown={handleLabelKeyDown}
                      className="h-5 w-32 text-xs"
                    />
                  ) : (
                    <>
                      {localDocumentType === 'Custom' ? (
                        <button
                          onClick={() => {
                            setEditedLabel('')
                            setIsEditingLabel(true)
                          }}
                          className="hover:bg-accent flex h-5 w-5 items-center justify-center rounded border border-dashed transition-colors">
                          <Plus className="h-3 w-3" />
                        </button>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="hover:bg-secondary/80 h-5 cursor-pointer px-2 text-xs"
                          onClick={() => setIsEditingLabel(true)}>
                          {localDocumentType}
                        </Badge>
                      )}
                    </>
                  )}
                </>
              )}

              {isAIGenerated && (
                <Badge variant="outline" className="h-5 gap-1 px-2 text-xs">
                  <Bot className="h-3 w-3" />
                </Badge>
              )}
            </>
          )}

          {!projectInfo && <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} className="ml-2" />}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tabs value={currentTab} onValueChange={onTabChange}>
          <TabsList>
            <TabsTrigger value="editor" className="gap-1.5 text-sm">
              Editor
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5 text-sm">
              Chat
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
