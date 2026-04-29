'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string
  file_name: string
  status: 'submitted' | 'late'
  submitted_at: string
}

export interface Assignment {
  id: string
  class_id: string
  title: string
  description: string | null
  week_number: number
  due_date: string
  created_at: string
  // tutor-enriched
  submission_count?: number
  missing_count?: number
  // student-enriched
  submission?: Submission | null
}

export interface SubmissionRow {
  student: {
    id: string
    full_name: string
    email: string
    avatar_initials: string
  }
  submission: Submission | null
  status: 'submitted' | 'late' | 'missing'
}

export function useAssignments(classId: string) {
  return useQuery({
    queryKey: ['assignments', classId],
    queryFn: () => apiClient.get<Assignment[]>(`/assignments/class/${classId}`),
    enabled: !!classId,
  })
}

export function useCreateAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      class_id: string
      title: string
      description?: string
      week_number: number
      due_date: string
    }) => apiClient.post<Assignment>('/assignments', body),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['assignments', vars.class_id] }),
  })
}

export function useDeleteAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ assignmentId }: { assignmentId: string; classId: string }) =>
      apiClient.delete(`/assignments/${assignmentId}`),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['assignments', vars.classId] }),
  })
}

export function useAssignmentSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () =>
      apiClient.get<SubmissionRow[]>(`/assignments/${assignmentId}/submissions`),
    enabled: !!assignmentId,
  })
}
