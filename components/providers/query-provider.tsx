'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data remains fresh for 5 minutes
            staleTime: 1000 * 60 * 5,
            // Unused data is garbage collected after 10 minutes
            gcTime: 1000 * 60 * 10,
            // Disable automatic refetching on window focus
            refetchOnWindowFocus: false,
            // Disable automatic refetching on reconnect
            refetchOnReconnect: false,
            // Retry failed requests once
            retry: 1,
            // Retry delay (exponential backoff)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
