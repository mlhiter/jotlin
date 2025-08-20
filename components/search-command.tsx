'use client'

import { useQuery } from '@tanstack/react-query'
import { File } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

import { documentApi } from '@/api/document'
import { useSession } from '@/hooks/use-session'
import { useSearch } from '@/stores/search'
import { Doc } from '@/types/document'

export const SearchCommand = () => {
  const router = useRouter()
  const { user } = useSession()

  const { data: documents } = useQuery({
    queryKey: ['search-documents'],
    queryFn: () => documentApi.getSearchDocuments(),
  })

  const [isMounted, setIsMounted] = useState(false)

  const toggle = useSearch((store) => store.toggle)
  const isOpen = useSearch((store) => store.isOpen)
  const onClose = useSearch((store) => store.onClose)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // watch keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [toggle])

  const onSelect = (id: string) => {
    router.push(`/documents/${id}`)
    onClose()
  }

  if (!isMounted) {
    return null
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder={`Search ${user?.name}'s jotlin...`} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Documents">
          {documents?.map((document: Doc) => (
            <CommandItem
              key={document.id}
              value={document.id}
              title={document.title}
              onSelect={() => onSelect(document.id)}>
              {document.icon ? (
                <p className="mr-2 text-[18px]">{document.icon}</p>
              ) : (
                <File className="mr-2 h-4 w-4" />
              )}
              <span>{document.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
