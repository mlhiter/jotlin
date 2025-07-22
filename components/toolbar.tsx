'use client'

import { ImageIcon, Smile, X } from 'lucide-react'
import { ElementRef, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

import { Button } from './ui/button'
import IconPicker from './icon-picker'
import { useDocument } from '@/stores/use-document'
import { useCoverImage } from '@/stores/use-cover-image'
import { update, removeIcon } from '@/api/document'

interface ToolbarProps {
  preview?: boolean
}

const Toolbar = ({ preview }: ToolbarProps) => {
  const inputRef = useRef<ElementRef<'textarea'>>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { document, onSetDocument } = useDocument()

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
    const newDocument = await update({
      _id: document?._id!,
      title: document?.title || 'Untitled',
    })
    onSetDocument(newDocument)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      disableInput()
    }
  }
  const onIconSelect = async (icon: string) => {
    const newDocument = await update({
      _id: document?._id!,
      icon,
    })
    onSetDocument(newDocument)
  }

  const onRemoveIcon = async () => {
    const newDocument = await removeIcon(document?._id!)
    onSetDocument(newDocument)
  }

  return (
    <div className="group relative pl-[54px]">
      {!!document?.icon && !preview && (
        <div className="group/icon flex items-center gap-x-2 pt-6">
          <IconPicker onChange={onIconSelect}>
            {/* FIXME:浏览器无法正确渲染emoji */}
            <p className="text-6xl transition hover:opacity-75">
              {document?.icon}
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
      {!!document?.icon && preview && (
        <p className="pt-6 text-6xl">{document?.icon}</p>
      )}
      <div className="flex items-center gap-x-1 py-4 opacity-0 group-hover:opacity-100">
        {!document?.icon && !preview && (
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
        {!document?.coverImage && !preview && (
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
          value={document?.title}
          onChange={(e) =>
            onSetDocument({ ...document!, title: e.target.value })
          }
          className="resize-none break-words bg-transparent text-5xl font-bold text-[#3F3F3F] outline-none dark:text-[#CFCFCF]"
        />
      ) : (
        <div
          onClick={enableInput}
          className="break-words pb-[11.5px] text-5xl font-bold text-[#3F3F3F] outline-none dark:text-[#CFCFCF]">
          {document?.title}
        </div>
      )}
    </div>
  )
}

export default Toolbar
