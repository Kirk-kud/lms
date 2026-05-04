'use client'

import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useClasses } from './useClasses'

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string
  file_name: string
  status: 'submitted' | 'late'
  submitted_at: string
  grade: number | null
  feedback: string | null
  graded_at: string | null
  graded_by: string | null
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

export interface AssignmentWithClass extends Assignment {
  class_title: string
}

export function useMyAllAssignments(userId: string) {
  const { data: classes = [] } = useClasses()

  const results = useQueries({
    queries: classes.map((c) => ({
      queryKey: ['assignments', c.id],
      queryFn: () => apiClient.get<Assignment[]>(`/assignments/class/${c.id}`),
      enabled: !!userId && !!c.id,
    })),
  })

  const data: AssignmentWithClass[] = results.flatMap((r, i) =>
    (r.data ?? []).map((a) => ({ ...a, class_title: classes[i]?.title ?? '' })),
  )

  const isLoading = !!userId && classes.length > 0 && results.some((r) => r.isLoading)

  return { data, isLoading }
}

export function useAssignments(classId: string) {
  return useQuery({
    queryKey: ['assignments', classId],
    queryFn: () => apiClient.get<Assignment[]>(`/assignments/class/${classId}`),
    enabled: !!classId,
  })
}

export function useAssignmentsBatch(classIds: string[]) {
  const uniqueIds = [...new Set(classIds.filter(Boolean))]
  return useQuery({
    queryKey: ['assignments-batch', uniqueIds.join(',')],
    queryFn: () =>
      apiClient.get<Record<string, Assignment[]>>(
        `/assignments/batch?class_ids=${uniqueIds.join(',')}`,
      ),
    enabled: uniqueIds.length > 0,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['assignments', vars.class_id] }),
        qc.invalidateQueries({ queryKey: ['assignments-batch'] }),
        qc.invalidateQueries({ queryKey: ['classes'] }),
        qc.invalidateQueries({ queryKey: ['classes', vars.class_id] }),
      ])
    },
  })
}

export function useDeleteAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ assignmentId }: { assignmentId: string; classId: string }) =>
      apiClient.delete(`/assignments/${assignmentId}`),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['assignments', vars.classId] }),
        qc.invalidateQueries({ queryKey: ['assignments-batch'] }),
        qc.invalidateQueries({ queryKey: ['submissions'] }),
        qc.invalidateQueries({ queryKey: ['classes'] }),
        qc.invalidateQueries({ queryKey: ['classes', vars.classId] }),
      ])
    },
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

export function useSubmissionViewUrl(assignmentId: string, submissionId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['submission-view-url', assignmentId, submissionId],
    queryFn: () =>
      apiClient.get<{ signed_url: string }>(`/assignments/${assignmentId}/submissions/${submissionId}/view-url`),
    enabled: enabled && !!assignmentId && !!submissionId,
    staleTime: 50 * 60 * 1000, // 50 min (signed URLs last 1 hour)
  })
}

export function useGradeSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      assignmentId,
      submissionId,
      grade,
      feedback,
    }: {
      assignmentId: string
      submissionId: string
      grade: number
      feedback?: string
    }) =>
      apiClient.patch(`/assignments/${assignmentId}/submissions/${submissionId}`, { grade, feedback }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['submissions', vars.assignmentId] })
    },
  })
}
