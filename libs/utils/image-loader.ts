type ImageStatus = 'loading' | 'loaded' | 'failed'

interface CacheEntry {
  status: ImageStatus
  src?: string
  promise?: Promise<string>
}

class ImageLoader {
  private cache = new Map<string, CacheEntry>()

  async load(src: string): Promise<string> {
    const cached = this.cache.get(src)

    // Already loaded successfully
    if (cached?.status === 'loaded' && cached.src) {
      return cached.src
    }

    // Failed before, don't retry
    if (cached?.status === 'failed') {
      throw new Error('Previously failed')
    }

    // Currently loading, return existing promise
    if (cached?.status === 'loading' && cached.promise) {
      return cached.promise
    }

    // Start new load
    const promise = new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        this.cache.set(src, { status: 'loaded', src })
        resolve(src)
      }

      img.onerror = () => {
        this.cache.set(src, { status: 'failed' })
        reject(new Error(`Failed to load: ${src}`))
      }

      // Start loading
      img.src = src
    })

    // Cache the promise
    this.cache.set(src, { status: 'loading', promise })

    return promise
  }

  getStatus(src: string): ImageStatus | undefined {
    return this.cache.get(src)?.status
  }
}

// Global singleton
export const imageLoader = new ImageLoader()
