'use client'

import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface UseUserResult {
  user: User | null
  role: string | null
  isLoading: boolean
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

  return {
    user,
    role: (user?.user_metadata?.role as string | null) ?? null,
    isLoading,
  }
}
