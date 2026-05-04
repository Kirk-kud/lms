'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface Announcement {
  id: string
  class_id: string
  author_id: string
  title: string
  body: string
  created_at: string
  author?: { full_name: string }
  class?: { title: string }
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: () => apiClient.get<Announcement[]>('/announcements'),
    refetchInterval: 60_000,
  })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { class_id: string; title: string; body: string }) =>
      apiClient.post<Announcement>('/announcements', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })
}
