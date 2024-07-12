'use client'

import { toast } from 'sonner'
import { mutate } from 'swr'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash, FolderUp, Download } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreateBlockNote } from '@blocknote/react'

import { archive, update } from '@/api/document'
import { useSession } from '@/hooks/use-session'
import { useDocument } from '@/stores/use-document'

interface MenuProps {
  documentId: string
}

const Menu = ({ documentId }: MenuProps) => {
  const router = useRouter()
  const { user } = useSession()
  const editor = useCreateBlockNote()
  const { document: currentDocument } = useDocument()

  const onArchive = async () => {
    try {
      toast.loading('Moving to trash...')
      archive(documentId)
      mutate(
        (key) =>
          typeof key === 'string' && key.startsWith('/api/document/sidebar')
      )
      toast.success('Note moved to trash.')
      router.push('/documents')
    } catch (error) {
      toast.error('Failed to archive note.')
    }
  }

  const onImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md'
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        const title = file.name.replace('.md', '')
        const markdownContent = await file.text()
        const blocks = await editor.tryParseMarkdownToBlocks(markdownContent)
        try {
          toast.loading('Importing note...')
          await update({
            _id: documentId,
            title,
            content: JSON.stringify(blocks),
          })
          mutate(
            (key) =>
              typeof key === 'string' &&
              key.startsWith('/api/document/get-document-by-id')
          )
          toast.success('Note imported.')
        } catch (error) {
          toast.error('Failed to import note.')
        }
      }
    }
    input.click()
  }

  const onExport = async () => {
    try {
      toast.loading('Exporting note...')
      const title = currentDocument?.title || 'Untitled'
      const blockContent = JSON.parse(currentDocument?.content as string) || []
      const markdownContent = await editor.blocksToMarkdownLossy(blockContent)

      const blob = new Blob([markdownContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title}.md`
      a.click()
      toast.success('Note exported.')
    } catch (error) {
      toast.error('Failed to export note.')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-60"
        align="end"
        alignOffset={8}
        forceMount>
        <DropdownMenuItem onClick={onImport}>
          <FolderUp className="mr-2 h-4 w-4" />
          Import from md file
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Export to md file
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onArchive}>
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="p-2 text-xs text-muted-foreground">
          Last edited by:{user?.username}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

Menu.Skeleton = function MenuSkeleton() {
  return <Skeleton className="h-6 w-10" />
}

export default Menu
