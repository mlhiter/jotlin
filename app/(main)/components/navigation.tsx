import {
  ChevronsLeft,
  MenuIcon,
  Plus,
  PlusCircle,
  Search,
  Settings,
  Trash,
  Inbox,
} from 'lucide-react'
import { mutate } from 'swr'
import { toast } from 'sonner'
import { useMediaQuery } from 'usehooks-ts'
import { ElementRef, useRef, useState, useEffect } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { create } from '@/api/document'
import { useSearch } from '@/stores/use-search'
import { useSettings } from '@/stores/use-settings'

import Item from './item'
import Navbar from './navbar'
import TrashBox from './trash-box'
import UserItem from './user-item'
import DocumentList from './document-list'
import InboxContent from './inbox-content'

const Navigation = () => {
  const router = useRouter()
  const settings = useSettings()
  const search = useSearch()
  const pathname = usePathname()
  const params = useParams()
  const isMobile = useMediaQuery('(max-width:768px)')

  const isResizingRef = useRef(false)
  const sidebarRef = useRef<ElementRef<'aside'>>(null)
  const navbarRef = useRef<ElementRef<'div'>>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

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

  // 鼠标按下添加事件监听器
  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.preventDefault()
    event.stopPropagation()

    isResizingRef.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 鼠标移动->改变侧边栏宽度和主栏样式
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

  // 鼠标抬起则移除事件监听器
  const handleMouseUp = () => {
    isResizingRef.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // function：重置侧边栏宽度
  const resetWidth = () => {
    if (sidebarRef.current && navbarRef.current) {
      setIsCollapsed(false)
      setIsResetting(true)

      sidebarRef.current.style.width = isMobile ? '100%' : '240px'
      navbarRef.current.style.setProperty(
        'width',
        isMobile ? '0' : 'calc(100% - 240px)'
      )
      navbarRef.current.style.setProperty('left', isMobile ? '100%' : '240px')

      // 这里是为了实现重置过程的一个小动画，300ms的动画当isResetting为true时，动画结束则设置isResetting为false
      setTimeout(() => {
        setIsResetting(false)
      }, 300)
    }
  }

  // function:折叠按钮
  const collapse = () => {
    if (sidebarRef.current && navbarRef.current) {
      setIsCollapsed(true)
      setIsResetting(true)

      sidebarRef.current.style.width = '0'
      navbarRef.current.style.setProperty('width', '100%')
      navbarRef.current.style.setProperty('left', '0')
      setTimeout(() => setIsResetting(false), 300)
    }
  }

  // function:创建一个新文件
  const handleCreate = async () => {
    try {
      toast.loading('Create a new note...')
      const documentId = await create('Untitled', '')
      toast.success('New note created!')
      router.push(`/documents/${documentId}`)
    } catch (error) {
      toast.error('Failed to create a new note')
    }
  }
  return (
    <>
      {/* 左侧边栏 */}
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
        {/* 用户信息+操作栏 */}
        <div>
          <UserItem />
          <Item onClick={search.onOpen} label="Search" icon={Search} isSearch />
          <Item onClick={settings.onOpen} label="Settings" icon={Settings} />
          <Popover>
            <PopoverTrigger className="group flex min-h-[27px] w-full items-center py-1 pl-3 pr-3 text-sm font-medium text-muted-foreground hover:bg-primary/5">
              <Inbox className="mr-2 h-[18px] w-[18px] shrink-0 text-muted-foreground" />
              <span className="truncate">Inbox</span>
            </PopoverTrigger>
            <PopoverContent
              className="mt-4 w-80 p-4"
              side={isMobile ? 'bottom' : 'right'}>
              <InboxContent />
            </PopoverContent>
          </Popover>
          <Item onClick={handleCreate} label="New Page" icon={PlusCircle} />
        </div>
        {/* 文档列表:共享和私人 */}
        <div className="mt-4">
          {/* 共享 */}
          <div>
            <div className="ml-4 text-base font-medium text-muted-foreground">
              Share
            </div>
            <DocumentList type="share" />
          </div>
          {/* 私人 */}
          <div>
            <div className="ml-4 text-base font-medium text-muted-foreground">
              Private
            </div>
            <DocumentList type="private" />
          </div>

          {/* 创建新页面 */}
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
        {/* 侧栏和主栏的分界线 */}
        <div
          onMouseDown={handleMouseDown}
          onClick={resetWidth}
          className="absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-primary/10 opacity-0 transition group-hover/sidebar:opacity-100"
        />
      </aside>
      {/* 顶部导航 */}
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
