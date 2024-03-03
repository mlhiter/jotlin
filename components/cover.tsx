'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Button } from './ui/button'
import { ImageIcon, X } from 'lucide-react'
import { useCoverImage } from '@/stores/use-cover-image'
import { useParams } from 'next/navigation'
import { useEdgeStore } from '@/lib/edgestore'
import { Skeleton } from '@/components/ui/skeleton'
import { removeCoverImage } from '@/api/document'

interface CoverImageProps {
  url?: string
  preview?: boolean
}
const Cover = ({ url, preview }: CoverImageProps) => {
  const { edgestore } = useEdgeStore()
  const params = useParams()
  const coverImage = useCoverImage()

  const onRemove = async () => {
    if (url) {
      await edgestore.publicFiles.delete({
        url: url,
      })
    }
    await removeCoverImage(params.documentId as string)
  }
  return (
    <div
      className={cn(
        'group relative h-[35vh] w-full',
        !url && 'h-[12vh]',
        url && 'bg-muted'
      )}>
      {!!url && <Image src={url} fill alt="Cover" className="object-cover" />}
      {url && !preview && (
        <div
          className="absolute bottom-5 right-5 flex
        items-center gap-x-2 opacity-0 group-hover:opacity-100">
          <Button
            onClick={() => coverImage.onReplace(url)}
            className="text-xs text-muted-foreground"
            variant="outline"
            size="sm">
            <ImageIcon className="mr-2 h-4 w-4" />
            Change cover
          </Button>
          <Button
            onClick={onRemove}
            className="text-xs text-muted-foreground"
            variant="outline"
            size="sm">
            <X className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
      )}
    </div>
  )
}
Cover.Skeleton = function CoverSkeleton() {
  return <Skeleton className="h-[12vh] w-full" />
}
export default Cover
