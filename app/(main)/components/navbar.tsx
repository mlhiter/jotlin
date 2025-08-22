'use client'

import { MenuIcon } from 'lucide-react'

import { DocumentNotificationBell } from '@/components/document-notification-bell'

import { useDocumentStore } from '@/stores/document'

import Banner from './banner'
import Invite from './invite'
import Menu from './menu'
import Publish from './publish'
import Title from './title'

interface NavbarProps {
  isCollapsed: boolean
  onResetWidth: () => void
}

const Navbar = ({ isCollapsed, onResetWidth }: NavbarProps) => {
  const { currentDocument } = useDocumentStore()

  if (currentDocument === undefined) {
    return (
      <nav className="flex w-full items-center justify-between bg-background px-3 py-2 dark:bg-[#1F1F1F]">
        <Title.Skeleton />
        <div className="flex items-center gap-x-2">
          <Menu.Skeleton />
        </div>
      </nav>
    )
  }
  if (currentDocument === null) {
    return null
  }
  return (
    <>
      <nav className="flex w-full items-center gap-x-4 bg-background px-3 py-2 dark:bg-[#1F1F1F]">
        {isCollapsed && <MenuIcon role="button" onClick={onResetWidth} className="h-6 w-6 text-muted-foreground" />}
        <div className="flex w-full items-center justify-between">
          <Title initialData={currentDocument} />
          <div className="flex items-center gap-x-2">
            <DocumentNotificationBell documentId={currentDocument.id} />
            <Invite documentId={currentDocument.id} />
            <Publish initialData={currentDocument} />
            <Menu documentId={currentDocument.id} />
          </div>
        </div>
      </nav>
      {currentDocument.isArchived && <Banner documentId={currentDocument.id} />}
    </>
  )
}

export default Navbar
