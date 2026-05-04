'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface AppNotification {
  id: string
  user_id: string
  type: 'new_assignment' | 'new_announcement' | string
  title: string
  body: string | null
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get<AppNotification[]>('/notifications'),
    refetchInterval: 30_000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications'] })
      const prev = qc.getQueryData<AppNotification[]>(['notifications'])
      qc.setQueryData<AppNotification[]>(
        ['notifications'],
        (old) => (old ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notifications'], ctx.prev)
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all'),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] })
      const prev = qc.getQueryData<AppNotification[]>(['notifications'])
      qc.setQueryData<AppNotification[]>(
        ['notifications'],
        (old) => (old ?? []).map((n) => ({ ...n, read: true })),
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['notifications'], ctx.prev)
    },
  })
}
