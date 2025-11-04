'use client'

import * as AvatarPrimitive from '@radix-ui/react-avatar'
import * as React from 'react'

import { imageLoader } from '@/libs/utils/image-loader'
import { cn } from '@/libs/utils/utils'

function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
}

function AvatarImage({ className, src, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  const [imageSrc, setImageSrc] = React.useState<string | undefined>(() => {
    if (!src || typeof src !== 'string') return undefined
    const status = imageLoader.getStatus(src as string)
    return status === 'loaded' ? src : undefined
  })

  React.useEffect(() => {
    if (!src) return

    const status = imageLoader.getStatus(src as string)

    // Already loaded
    if (status === 'loaded') {
      setImageSrc(src as string)
      return
    }

    // Previously failed
    if (status === 'failed') {
      return
    }

    // Load (or wait for existing load)
    imageLoader
      .load(src as string)
      .then((loadedSrc) => setImageSrc(loadedSrc))
      .catch(() => {
        // Fail silently, fallback will show
      })
  }, [src])

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      src={imageSrc}
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
