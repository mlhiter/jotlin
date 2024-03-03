'use client'

import { useParams } from 'next/navigation'
import { MenuIcon } from 'lucide-react'
import Title from './title'
import Banner from './banner'
import Menu from './menu'
import Publish from './publish'
import Invite from './invite'
import { useEffect, useState } from 'react'
import { getById, Doc } from '@/api/document'

interface NavbarProps {
  isCollapsed: boolean
  onResetWidth: () => void
}

const Navbar = ({ isCollapsed, onResetWidth }: NavbarProps) => {
  const params = useParams()
  const [document, setDocument] = useState<Doc>()

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await getById(params.documentId as string)
        setDocument(response.data.data)
      } catch (error) {
        console.error('Error fetching document:', error)
      }
    }
    fetchDocument()
  }, [params.documentId])

  if (document === undefined) {
    return (
      <nav className="flex w-full items-center justify-between bg-background px-3 py-2 dark:bg-[#1F1F1F]">
        <Title.Skeleton />
        <div className="flex items-center gap-x-2">
          <Menu.Skeleton />
        </div>
      </nav>
    )
  }
  if (document === null) {
    return null
  }
  return (
    <>
      <nav className="flex w-full items-center gap-x-4 bg-background px-3 py-2 dark:bg-[#1F1F1F]">
        {isCollapsed && (
          <MenuIcon
            role="button"
            onClick={onResetWidth}
            className="h-6 w-6 text-muted-foreground"
          />
        )}
        <div className="flex w-full items-center justify-between">
          <Title initialData={document} />
          <div className="flex items-center gap-x-2">
            {/* <Invite documentId={document._id} /> */}
            <Publish initialData={document} />
            <Menu documentId={document._id} />
          </div>
        </div>
      </nav>
      {document.isArchived && <Banner documentId={document._id} />}
    </>
  )
}

export default Navbar
