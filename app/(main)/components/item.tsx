'use client'

import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronRight,
  LucideIcon,
  MoreHorizontal,
  Plus,
  Trash,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

import { documentApi } from '@/api/document'
import { useDocumentActions } from '@/hooks/use-document-actions'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/libs/utils'

interface ItemProps {
  id?: string
  documentIcon?: string
  active?: boolean
  expanded?: boolean
  isSearch?: boolean
  level?: number
  onExpand?: () => void
  label: string
  onClick?: () => void
  icon: LucideIcon
  type?: 'private' | 'share'
  hideActions?: boolean
  ownerId?: string
}

const Item = ({
  id,
  documentIcon,
  active,
  expanded,
  isSearch,
  label,
  onExpand,
  level = 0,
  onClick,
  icon: Icon,
  type,
  hideActions = false,
  ownerId,
}: ItemProps) => {
  const router = useRouter()
  const { user } = useSession()
  const { archiveDocument, createDocument } = useDocumentActions()
  const queryClient = useQueryClient()

  // 判断当前用户是否是文档创建者
  const isOwner = ownerId === user?.id

  const onArchive = async (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.stopPropagation()
    if (!id) return
    await archiveDocument(id)
  }

  const onQuitDocument = () => {
    if (!id) return
    const promise = documentApi
      .removeAccess({
        documentId: id,
        collaboratorEmail: user!.email,
      })
      .then(() => {
        // 刷新文档列表以移除退出的文档
        queryClient.invalidateQueries({
          queryKey: ['documents'],
          exact: false,
        })
        router.push('/documents')
      })

    toast.promise(promise, {
      loading: 'quit...',
      success: 'You quit this document',
      error: 'Failed to quit it.',
    })
  }

  const handleExpand = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.stopPropagation()
    onExpand?.()
  }

  const onCreate = async (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.stopPropagation()

    if (!id) return

    if (!expanded) {
      onExpand?.()
    }
    await createDocument(id)
  }

  const ChevronIcon = expanded ? ChevronDown : ChevronRight

  return (
    <div
      onClick={onClick}
      role="button"
      style={{ paddingLeft: level ? `${level * 12 + 12}px` : '12px' }}
      className={cn(
        'group flex min-h-[27px] w-full items-center py-1 pr-3 text-sm font-medium text-muted-foreground hover:bg-primary/5',
        active && 'bg-primary/5 text-primary'
      )}>
      {!!id && !hideActions && (
        <div
          role="button"
          className="mr-1 h-full rounded-sm  hover:bg-neutral-300
          dark:hover:bg-neutral-600"
          onClick={handleExpand}>
          <ChevronIcon className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        </div>
      )}
      {documentIcon ? (
        <div className="mr-2 shrink-0 text-[18px]">{documentIcon}</div>
      ) : (
        <Icon className="mr-2 h-[18px] w-[18px] shrink-0 text-muted-foreground" />
      )}
      <span className="truncate">{label}</span>
      {isSearch && (
        <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">Control</span>K
        </kbd>
      )}
      {!!id && (
        <div className="ml-auto flex items-center gap-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <div
                role="button"
                className="ml-auto h-full rounded-sm opacity-0 hover:bg-neutral-300 group-hover:opacity-100 dark:hover:bg-neutral-600">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-60"
              align="start"
              side="right"
              forceMount>
              <DropdownMenuItem onClick={isOwner ? onArchive : onQuitDocument}>
                <Trash className="mr-2 h-4 w-4" />
                {isOwner ? 'Delete' : 'Quit'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="p-2 text-xs text-muted-foreground">
                Last edited by:{user?.name}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          {!hideActions && (
            <div
              role="button"
              onClick={onCreate}
              className="ml-auto h-full rounded-sm opacity-0 hover:bg-neutral-300 group-hover:opacity-100 dark:hover:bg-neutral-600">
              <Plus className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

Item.Skeleton = function ItemSkeleton({ level }: { level?: number }) {
  return (
    <div
      style={{
        paddingLeft: level ? `${level * 12 + 25}px` : '12px',
      }}
      className="flex gap-x-2 py-[3px]">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-[30%]" />
    </div>
  )
}
export default Item
