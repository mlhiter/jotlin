'use client'

import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { updateDocument } from '@/api/document'
import { Doc } from '@/types/document'
import { useDocumentStore } from '@/stores/document'

interface TitleProps {
  initialData: Doc
}

const Title = ({ initialData }: TitleProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(initialData.title || 'untitled')
  const [isEditing, setIsEditing] = useState(false)
  const { setCurrentDocument } = useDocumentStore()

  const enableInput = () => {
    setTitle(initialData.title as string)
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(0, inputRef.current.value.length)
    }, 0)
  }
  const disableInput = async () => {
    setIsEditing(false)
    const document = await updateDocument({
      id: initialData.id,
      title: title || 'untitled',
    })
    setCurrentDocument(document)
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
          onClick={enableInput}
          onBlur={disableInput}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={onKeyDown}
          value={title}
          className="h-7 px-2 focus-visible:ring-transparent"
        />
      ) : (
        <Button
          onClick={enableInput}
          variant="ghost"
          size="sm"
          className="h-auto p-1 font-normal">
          <span className="truncate">{initialData?.title}</span>
        </Button>
      )}
    </div>
  )
}

Title.Skeleton = function TitleSkeleton() {
  return <Skeleton className="h-6 w-20 rounded-md" />
}
export default Title
