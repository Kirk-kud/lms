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

export function useClasses(userId?: string) {
  return useQuery({
    queryKey: ['classes', userId ?? null],
    queryFn: () => apiClient.get<ClassRecord[]>('/classes'),
    enabled: !!userId,
  })
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: () => apiClient.get<ClassRecord>(`/classes/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useCreateClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title: string; description?: string }) =>
      apiClient.post<ClassRecord>('/classes', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  })
}

export function useJoinClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { invite_code: string }) =>
      apiClient.post<ClassRecord>('/classes/join', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  })
}

export function useRoster(classId: string) {
  return useQuery({
    queryKey: ['roster', classId],
    queryFn: () => apiClient.get<RosterEntry[]>(`/classes/${classId}/roster`),
    enabled: !!classId,
  })
}
