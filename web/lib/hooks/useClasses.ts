'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface ClassRecord {
  id: string
  tutor_id: string
  title: string
  description: string | null
  invite_code: string
  enrolled_count: number
  cohort_count?: number
  tutor?: { full_name: string; email: string }
  created_at: string
}

export interface RosterEntry {
  student: {
    id: string
    full_name: string
    email: string
    avatar_initials: string
    created_at: string
  }
  attendance_pct: number
  submission_count: number
  enrolled_at: string
}

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: () => apiClient.get<ClassRecord[]>('/classes'),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: () => apiClient.get<ClassRecord>(`/classes/${id}`),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export function useCreateClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title: string; description?: string }) =>
      apiClient.post<ClassRecord>('/classes', body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

export function useJoinClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { invite_code: string }) =>
      apiClient.post<ClassRecord>('/classes/join', body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

export function useDeleteClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (classId: string) => apiClient.delete(`/classes/${classId}`),
    onSuccess: async (_data, classId) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['classes'] }),
        qc.invalidateQueries({ queryKey: ['classes', classId] }),
      ])
    },
  })
}

export function useRoster(classId: string) {
  return useQuery({
    queryKey: ['roster', classId],
    queryFn: () => apiClient.get<RosterEntry[]>(`/classes/${classId}/roster`),
    enabled: !!classId,
  })
}
