'use client'

import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { useEffect } from 'react'
import { refreshAccessToken } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'

interface UseUserResult {
  user: User | null
  role: string | null
  isLoading: boolean
}

function decodeJwt(token: string): { exp?: number } & Record<string, unknown> {
  try {
    const [, payload] = token.split('.')
    const decoded = JSON.parse(atob(payload))
    return decoded
  } catch {
    return {}
  }
}

function getTimeUntilExpiration(token: string): number {
  const payload = decodeJwt(token)
  if (typeof payload.exp !== 'number') return -1
  const expirationMs = payload.exp * 1000
  const nowMs = Date.now()
  return expirationMs - nowMs
}

export function useUser(): UseUserResult {
  const { data: user = null, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      if (typeof window === 'undefined') return null
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session?.user ?? null
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })

  // Proactive token refresh: refresh 2 minutes before expiration
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let isCancelled = false

    const scheduleRefresh = () => {
      if (isCancelled) return

      const accessToken = localStorage.getItem('access_token')
      if (!accessToken) return

      const timeUntilExpiration = getTimeUntilExpiration(accessToken)
      if (timeUntilExpiration < 0) return

      // Refresh 2 minutes (120000 ms) before expiration
      const refreshIn = Math.max(0, timeUntilExpiration - 120000)

      timeoutId = setTimeout(async () => {
        const refreshedToken = await refreshAccessToken()
        if (!isCancelled && refreshedToken) {
          scheduleRefresh()
        }
      }, refreshIn)
    }

    scheduleRefresh()

    return () => {
      isCancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  return {
    user,
    role: (user?.user_metadata?.role as string | null) ?? null,
    isLoading,
  }
}
