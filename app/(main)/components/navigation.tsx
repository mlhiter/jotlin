import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronsLeft,
  MenuIcon,
  Plus,
  PlusCircle,
  Search,
  Settings,
  Trash,
  Inbox,
  MessageSquare,
} from 'lucide-react'
import { useParams, usePathname } from 'next/navigation'
import { ElementRef, useRef, useState, useEffect, useCallback } from 'react'
import { useMediaQuery } from 'usehooks-ts'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { useDocumentActions } from '@/hooks/use-document-actions'
import { useSession } from '@/hooks/use-session'
import { useUnifiedNotifications } from '@/hooks/use-unified-notifications'
import { cn } from '@/libs/utils'
import { useSearch } from '@/stores/search'
import { useSettings } from '@/stores/settings'

import { ChatList } from './chat-list'
import DocumentList from './document-list'
import Item from './item'
import Navbar from './navbar'
import TrashBox from './trash-box'
import { UnifiedInboxContent } from './unified-inbox-content'
import UserItem from './user-item'

const Navigation = () => {
  const settings = useSettings()
  const search = useSearch()
  const pathname = usePathname()
  const params = useParams()
  const queryClient = useQueryClient()
  const { createDocument } = useDocumentActions()
  const isMobile = useMediaQuery('(max-width:768px)')
  const { unreadCount } = useUnifiedNotifications()
  const { user } = useSession()

  const isResizingRef = useRef(false)
  const sidebarRef = useRef<ElementRef<'aside'>>(null)
  const navbarRef = useRef<ElementRef<'div'>>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isInboxOpen, setIsInboxOpen] = useState(false)

  useEffect(() => {
    if (isMobile) {
      collapse()
    } else {
      resetWidth()
    }
  }, [isMobile])

  useEffect(() => {
    if (isMobile) {
      collapse()
    }
  }, [pathname, isMobile])

  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.preventDefault()
    event.stopPropagation()

    isResizingRef.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!isResizingRef.current) return
    let newWidth = event.clientX
    if (newWidth < 240) newWidth = 240
    if (newWidth > 480) newWidth = 480

    if (sidebarRef.current && navbarRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`
      navbarRef.current.style.setProperty('left', `${newWidth}px`)
      navbarRef.current.style.setProperty('width', `calc(100% - ${newWidth}px)`)
    }
  }

  const handleMouseUp = () => {
    isResizingRef.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const resetWidth = useCallback(() => {
    if (sidebarRef.current && navbarRef.current) {
      setIsCollapsed(false)
      setIsResetting(true)

      sidebarRef.current.style.width = isMobile ? '100%' : '240px'
      navbarRef.current.style.setProperty(
        'width',
        isMobile ? '0' : 'calc(100% - 240px)'
      )
      navbarRef.current.style.setProperty('left', isMobile ? '100%' : '240px')

      setTimeout(() => {
        setIsResetting(false)
      }, 300)
    }
  }, [isMobile])

  const collapse = useCallback(() => {
    if (sidebarRef.current && navbarRef.current) {
      setIsCollapsed(true)
      setIsResetting(true)

      sidebarRef.current.style.width = '0'
      navbarRef.current.style.setProperty('width', '100%')
      navbarRef.current.style.setProperty('left', '0')
      setTimeout(() => setIsResetting(false), 300)
    }
  }, [])

  const handleCreate = () => createDocument()

  return (
    <>
      {/* left sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'group/sidebar relative  flex h-full w-60 flex-col overflow-y-auto bg-secondary',
          isResetting && 'transition-all duration-300 ease-in-out',
          isMobile && 'w-0'
        )}>
        <div
          role="button"
          onClick={collapse}
          className={cn(
            'absolute right-2 top-3 h-6 w-6 rounded-sm text-muted-foreground opacity-0 transition hover:bg-neutral-300 group-hover/sidebar:opacity-100 dark:hover:bg-neutral-600',
            isMobile && 'opacity-100'
          )}>
          <ChevronsLeft className="h-6 w-6" />
        </div>
        {/* userinfo+action */}
        <div>
          <UserItem />
          <Item onClick={search.onOpen} label="Search" icon={Search} isSearch />
          <Item onClick={settings.onOpen} label="Settings" icon={Settings} />
          <Popover open={isInboxOpen} onOpenChange={setIsInboxOpen}>
            <PopoverTrigger className="group flex min-h-[27px] w-full items-center py-1 pl-3 pr-3 text-sm font-medium text-muted-foreground hover:bg-primary/5">
              <div className="relative mr-2">
                <Inbox className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                {unreadCount > 0 && (
                  <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </div>
              <span className="truncate">Inbox</span>
            </PopoverTrigger>
            <PopoverContent
              className="mt-4 w-auto p-0"
              side={isMobile ? 'bottom' : 'right'}>
              <UnifiedInboxContent onClose={() => setIsInboxOpen(false)} />
            </PopoverContent>
          </Popover>
          <Item onClick={handleCreate} label="New Page" icon={PlusCircle} />
        </div>

        {/* document list and chat list */}
        <div className="mt-4">
          {/* chat */}
          <div>
            <div className="ml-4 flex items-center gap-2 text-base font-medium text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>Chats</span>
            </div>
            <ChatList />
          </div>
          {/* shared */}
          <div>
            <div className="ml-4 text-base font-medium text-muted-foreground">
              Share
            </div>
            <DocumentList type="share" />
          </div>
          {/* private */}
          <div>
            <div className="ml-4 text-base font-medium text-muted-foreground">
              Private
            </div>
            <DocumentList type="private" />
          </div>

          {/* create new page */}
          <Item onClick={handleCreate} icon={Plus} label="Add a page" />

          {/* Trash */}
          <Popover>
            <PopoverTrigger className="mt-4 w-full">
              <Item label="Trash" icon={Trash} />
            </PopoverTrigger>
            <PopoverContent
              className="w-72 p-0"
              side={isMobile ? 'bottom' : 'right'}>
              <TrashBox />
            </PopoverContent>
          </Popover>
        </div>
        <div
          onMouseDown={handleMouseDown}
          onClick={resetWidth}
          className="absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-primary/10 opacity-0 transition group-hover/sidebar:opacity-100"
        />
      </aside>
      {/* top navbar */}
      <div
        ref={navbarRef}
        className={cn(
          'w-[calc(100% - 240px)] absolute left-60 top-0 z-[99999]',
          isResetting && 'transition-all duration-300 ease-in-out',
          isMobile && 'left-0 w-full'
        )}>
        {!!params.documentId ? (
          <Navbar isCollapsed={isCollapsed} onResetWidth={resetWidth} />
        ) : (
          <nav className="w-full bg-transparent px-3 py-2">
            {isCollapsed && (
              <MenuIcon
                onClick={resetWidth}
                role="button"
                className="h-6 w-6 text-muted-foreground"
              />
            )}
          </nav>
        )}
      </div>
    </>
  )
}

export default Navigation
