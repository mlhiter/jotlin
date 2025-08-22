'use client'

import { PlusCircle } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { documentApi } from '@/api/document'
import { useSession } from '@/hooks/use-session'

const DocumentsPage = () => {
  const router = useRouter()
  const { user } = useSession()

  const onCreate = async () => {
    try {
      toast.loading('Creating a new note.....')
      const documentId = await documentApi.create({
        title: 'Untitled',
        parentDocument: null,
      })
      router.push(`/documents/${documentId}`)
    } catch (error) {
      toast.error('Failed to create a new note.')
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <Image src="/empty.png" height="300" width="300" alt="Empty" className="dark:hidden" />
      <Image src="/empty-dark.png" height="300" width="300" alt="Empty" className="hidden dark:block" />
      <h2 className="text-lg font-medium">Welcome to {user?.name || 'your'}&apos;s Jotlin</h2>
      <Button onClick={onCreate}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Create a note
      </Button>
    </div>
  )
}

export default DocumentsPage
