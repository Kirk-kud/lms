'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface AttendanceSession {
  id: string
  class_id: string
  pin_code: string
  started_at: string
  expires_at: string
  is_active: boolean
  present_count?: number
  absent_count?: number
}

export interface AttendanceRecordRow {
  student: {
    id: string
    full_name: string
    email: string
    avatar_initials: string
  }
  checked_in_at: string
}

export interface SessionRecords {
  present: AttendanceRecordRow[]
  absent: { id: string; full_name: string; email: string; avatar_initials: string }[]
}

export interface MyAttendanceRow {
  session: AttendanceSession
  present: boolean
  checked_in_at: string | null
}

export function useAttendanceSessions(classId: string) {
  return useQuery({
    queryKey: ['attendance-sessions', classId],
    queryFn: () =>
      apiClient.get<AttendanceSession[]>(`/attendance/sessions/class/${classId}`),
    enabled: !!classId,
  })
}

export function useStartSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { class_id: string }) =>
      apiClient.post<AttendanceSession>('/attendance/sessions', body),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['attendance-sessions', vars.class_id] }),
  })
}

export function useEndSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, classId }: { sessionId: string; classId: string }) =>
      apiClient.patch<AttendanceSession>(`/attendance/sessions/${sessionId}`),
    onSuccess: (_data, { classId }) =>
      qc.invalidateQueries({ queryKey: ['attendance-sessions', classId] }),
  })
}

export function useSessionRecords(sessionId: string) {
  return useQuery({
    queryKey: ['session-records', sessionId],
    queryFn: () =>
      apiClient.get<SessionRecords>(`/attendance/sessions/${sessionId}/records`),
    enabled: !!sessionId,
  })
}

export function useMyAttendance(classId: string) {
  return useQuery({
    queryKey: ['my-attendance', classId],
    queryFn: () =>
      apiClient.get<MyAttendanceRow[]>(`/attendance/my/${classId}`),
    enabled: !!classId,
  })
}
