'use client'

import { useMemo } from 'react'

import apiClient from '@/lib/axios'

/**
 * Hook that provides an authenticated axios instance
 * The axios instance automatically includes JWT token in Authorization header
 */
export const useApi = () => {
  return useMemo(() => apiClient, [])
}

export default useApi
