'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

import { useDocumentActions } from '@/hooks/use-document-actions'
import { Doc } from '@/types/document'

interface TitleProps {
  initialData: Doc
}

const Title = ({ initialData }: TitleProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(initialData.title || 'untitled')
  const [isEditing, setIsEditing] = useState(false)
  const { updateDocument } = useDocumentActions()

  useEffect(() => {
    setTitle(initialData.title || 'untitled')
  }, [initialData.title])

  const enableInput = () => {
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      // Only select all text when first enabling edit mode
      if (!isEditing) {
        inputRef.current?.setSelectionRange(0, inputRef.current.value.length)
      }
    }, 0)
  }

  const disableInput = async () => {
    setIsEditing(false)
    const newTitle = title || 'untitled'
    setTitle(newTitle)
    await updateDocument({
      id: initialData.id,
      title: newTitle,
    })
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      disableInput()
    }
  }

  return (
    <div className="flex items-center gap-x-1">
      {!!initialData.icon && <p>{initialData.icon}</p>}
      {isEditing ? (
        <Input
          ref={inputRef}
          onBlur={disableInput}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={onKeyDown}
          value={title}
          className="h-7 px-2 focus-visible:ring-transparent"
        />
      ) : (
        <Button onClick={enableInput} variant="ghost" size="sm" className="h-auto p-1 font-normal">
          <span className="truncate">{title}</span>
        </Button>
      )}
    </div>
  )
}

Title.Skeleton = function TitleSkeleton() {
  return <Skeleton className="h-6 w-20 rounded-md" />
}
export default Title
