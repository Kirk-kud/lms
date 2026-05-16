'use client'

import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface UseUserResult {
  user: User | null
  role: string | null
  isLoading: boolean
}

function decodeJwt(token: string): { exp?: number } & Record<string, any> {
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
  if (!payload.exp) return -1
  const expirationMs = payload.exp * 1000
  const nowMs = Date.now()
  return expirationMs - nowMs
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) return null

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      )

      const json = (await res.json()) as {
        data: { access_token: string }
        message: string
        statusCode: number
      }

      if (!res.ok) return null

      const newAccessToken = json.data.access_token
      localStorage.setItem('access_token', newAccessToken)
      return newAccessToken
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
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
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) return

    const timeUntilExpiration = getTimeUntilExpiration(accessToken)
    if (timeUntilExpiration < 0) return

    // Refresh 2 minutes (120000 ms) before expiration
    const refreshIn = Math.max(0, timeUntilExpiration - 120000)

    const timeoutId = setTimeout(async () => {
      await refreshAccessToken()
    }, refreshIn)

    return () => clearTimeout(timeoutId)
  }, [])

  return {
    user,
    role: (user?.user_metadata?.role as string | null) ?? null,
    isLoading,
  }
}
