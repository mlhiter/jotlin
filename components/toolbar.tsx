'use client'

import { ImageIcon, Smile, X } from 'lucide-react'
import { ElementRef, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

import { Button } from './ui/button'
import IconPicker from './icon-picker'
import { useCoverImage } from '@/stores/cover-image'
import { useDocumentStore } from '@/stores/document'
import { updateDocument, removeDocumentIcon } from '@/api/document'

interface ToolbarProps {
  preview?: boolean
}

const Toolbar = ({ preview }: ToolbarProps) => {
  const inputRef = useRef<ElementRef<'textarea'>>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { currentDocument, setCurrentDocument } = useDocumentStore()

  const coverImage = useCoverImage()
  const enableInput = () => {
    if (preview) return
    setIsEditing(true)

    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const disableInput = async () => {
    setIsEditing(false)
    const newDocument = await updateDocument({
      id: currentDocument?.id!,
      title: currentDocument?.title || 'Untitled',
    })
    setCurrentDocument(newDocument)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      disableInput()
    }
  }
  const onIconSelect = async (icon: string) => {
    const newDocument = await updateDocument({
      id: currentDocument?.id!,
      icon,
    })
    setCurrentDocument(newDocument)
  }

  const onRemoveIcon = async () => {
    const newDocument = await removeDocumentIcon(currentDocument?.id!)
    setCurrentDocument(newDocument)
  }

  return (
    <div className="group relative pl-[54px]">
      {!!currentDocument?.icon && !preview && (
        <div className="group/icon flex items-center gap-x-2 pt-6">
          <IconPicker onChange={onIconSelect}>
            <p className="text-6xl transition hover:opacity-75">
              {currentDocument?.icon}
            </p>
          </IconPicker>
          <Button
            onClick={onRemoveIcon}
            className="rounded-full text-xs text-muted-foreground opacity-0 transition group-hover/icon:opacity-100"
            variant="outline"
            size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {!!currentDocument?.icon && preview && (
        <p className="pt-6 text-6xl">{currentDocument?.icon}</p>
      )}
      <div className="flex items-center gap-x-1 py-4 opacity-0 group-hover:opacity-100">
        {!currentDocument?.icon && !preview && (
          <IconPicker asChild onChange={onIconSelect}>
            <Button
              className="text-xs text-muted-foreground"
              variant="outline"
              size="sm">
              <Smile className="mr-2 h-4 w-4" />
              Add icon
            </Button>
          </IconPicker>
        )}
        {!currentDocument?.coverImage && !preview && (
          <Button
            onClick={coverImage.onOpen}
            className="text-xs text-muted-foreground"
            variant="outline"
            size="sm">
            <ImageIcon className="mr-2 h-4 w-4" />
            Add cover
          </Button>
        )}
      </div>
      {isEditing && !preview ? (
        <TextareaAutosize
          ref={inputRef}
          onBlur={disableInput}
          onKeyDown={onKeyDown}
          value={currentDocument?.title}
          onChange={(e) =>
            setCurrentDocument({ ...currentDocument!, title: e.target.value })
          }
          className="resize-none break-words bg-transparent text-5xl font-bold text-[#3F3F3F] outline-none dark:text-[#CFCFCF]"
        />
      ) : (
        <div
          onClick={enableInput}
          className="break-words pb-[11.5px] text-5xl font-bold text-[#3F3F3F] outline-none dark:text-[#CFCFCF]">
          {currentDocument?.title}
        </div>
      )}
    </div>
  )
}

export default Toolbar
