'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface Announcement {
  id: string
  created_by: string | null
  creator?: { full_name: string } | null
  message: string
  target_type: 'all_tutors' | 'whole_class' | 'specific_cohort'
  class_id: string | null
  cohort_id: string | null
  is_anonymous: boolean
  created_at: string
}

export interface CreateAnnouncementPayload {
  message: string
  target_type: 'all_tutors' | 'whole_class' | 'specific_cohort'
  class_id?: string
  cohort_id?: string
  is_anonymous?: boolean
}

export function useAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => apiClient.get<Announcement[]>('/announcements'),
  })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) =>
      apiClient.post<Announcement>('/announcements', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<null>(`/announcements/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}
