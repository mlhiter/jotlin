'use client'

import { ChevronDown, ChevronUp, Search, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/libs/utils/utils'

interface ChatThread {
  id: string
  title: string | null
  messageCount: number
  lastMessageAt: Date
}

interface ThreadSwitcherProps {
  threads: ChatThread[]
  currentThreadId: string
  onSelectThread: (threadId: string) => void
  onCreateThread: () => void
  onRenameThread: (threadId: string, newTitle: string) => void
  onDeleteThread: (threadId: string) => void
  isLoading?: boolean
}

export function ThreadSwitcher({
  threads,
  currentThreadId,
  onSelectThread,
  onCreateThread,
  onRenameThread,
  onDeleteThread,
  isLoading,
}: ThreadSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentThread = threads.find((t) => t.id === currentThreadId)

  // Auto-focus search when opening
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    } else {
      setSearchQuery('')
    }
  }, [open])

  // Filter threads by search query
  const filteredThreads = threads.filter((thread) => thread.title?.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleSelectThread = (threadId: string) => {
    onSelectThread(threadId)
    setOpen(false)
  }

  const handleCreateThread = () => {
    onCreateThread()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'h-8 gap-2 px-3 font-medium transition-all',
            'hover:border-border hover:bg-accent/50 border border-transparent',
            open && 'border-border bg-accent/50'
          )}>
          <span className="max-w-[200px] truncate text-sm">{currentThread?.title || 'Select Thread'}</span>
          {open ? <ChevronUp className="size-3.5 opacity-50" /> : <ChevronDown className="size-3.5 opacity-50" />}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start" sideOffset={4}>
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="border-b p-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
              <Input
                ref={searchInputRef}
                placeholder="Search threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>
          </div>

          {/* Thread List */}
          <div className="max-h-[320px] overflow-y-auto p-1">
            {filteredThreads.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                {searchQuery ? 'No threads found' : 'No threads yet'}
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={thread.id === currentThreadId}
                  onSelect={() => handleSelectThread(thread.id)}
                  onRename={(newTitle) => onRenameThread(thread.id, newTitle)}
                  onDelete={() => onDeleteThread(thread.id)}
                />
              ))
            )}
          </div>

          {/* New Thread Button */}
          <div className="border-t p-1">
            <Button
              variant="ghost"
              className="h-9 w-full justify-start gap-2 text-sm font-medium"
              onClick={handleCreateThread}>
              <Plus className="size-4" />
              New Conversation
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Thread Item Component
interface ThreadItemProps {
  thread: ChatThread
  isActive: boolean
  onSelect: () => void
  onRename: (newTitle: string) => void
  onDelete: () => void
}

function ThreadItem({ thread, isActive, onSelect, onRename, onDelete }: ThreadItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(thread.title || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleRename = () => {
    if (editedTitle.trim() && editedTitle !== thread.title) {
      onRename(editedTitle.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setEditedTitle(thread.title || '')
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    setShowDeleteConfirm(false)
    onDelete()
  }

  if (isEditing) {
    return (
      <div className="px-2 py-1.5">
        <Input
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm"
          autoFocus
        />
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-md px-2 py-1.5',
          'cursor-pointer transition-colors',
          isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
        )}
        onClick={onSelect}>
        {/* Active Indicator */}
        <div
          className={cn(
            'size-2 rounded-full transition-colors',
            isActive ? 'bg-primary' : 'border-border border bg-transparent'
          )}
        />

        {/* Thread Title */}
        <span className="flex-1 truncate text-sm">{thread.title || 'New Conversation'}</span>

        {/* Message Count Badge */}
        {thread.messageCount > 0 && <span className="text-muted-foreground text-xs">{thread.messageCount}</span>}

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="size-6 opacity-0 transition-opacity group-hover:opacity-100">
              <MoreHorizontal className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="mr-2 size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Thread?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{thread.title || 'this conversation'}&quot; and all its messages. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
