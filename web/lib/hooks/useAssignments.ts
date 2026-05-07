'use client'

import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query'
import { apiClient, ApiError, getApiBaseUrl } from '@/lib/api'

export interface SubmissionViewPayload {
  submission_kind: 'pdf' | 'text' | 'link'
  signed_url: string | null
  submission_text: string | null
  submission_link_url: string | null
}
import { useClasses } from './useClasses'

export type ExpectedSubmissionType = 'pdf_file' | 'text' | 'link'

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string | null
  file_name: string | null
  /** Student text response when `expected_submission_type` is `text`. */
  submission_text?: string | null
  /** Student URL when `expected_submission_type` is `link`. */
  submission_link_url?: string | null
  status: 'submitted' | 'late'
  submitted_at: string
  signed_url?: string | null
  grade?: number | null
  feedback?: string | null
  graded_at?: string | null
  graded_by?: string | null
}

export interface Assignment {
  id: string
  class_id: string
  title: string
  description: string | null
  week_number: number
  due_date: string
  created_at: string
  /** What students submit (defaults to pdf_file server-side when missing). */
  expected_submission_type?: ExpectedSubmissionType
  instruction_file_path?: string | null
  instruction_file_name?: string | null
  instruction_link_url?: string | null
  instruction_text?: string | null
  /** Signed URL when `instruction_file_path` is set (API-enriched). */
  instruction_file_signed_url?: string | null
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
      expected_submission_type?: ExpectedSubmissionType
      instruction_link_url?: string
      instruction_text?: string
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
      apiClient.get<SubmissionViewPayload>(`/assignments/${assignmentId}/submissions/${submissionId}/view-url`),
    enabled: enabled && !!assignmentId && !!submissionId,
    staleTime: 50 * 60 * 1000, // 50 min (signed URLs last 1 hour)
  })
}

export function useUpdateAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      assignmentId: string
      classId: string
      title?: string
      description?: string
      due_date?: string
      expected_submission_type?: ExpectedSubmissionType
      instruction_link_url?: string | null
      instruction_text?: string | null
      clear_instruction_pdf?: boolean
    }) => {
      const { assignmentId, classId, ...body } = vars
      void classId
      return apiClient.patch<Assignment>(`/assignments/${assignmentId}`, body)
    },
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['assignments', vars.classId] }),
        qc.invalidateQueries({ queryKey: ['assignments-batch'] }),
      ])
    },
  })
}

export async function uploadAssignmentInstructionPdf(
  assignmentId: string,
  file: File,
): Promise<Assignment> {
  const formData = new FormData()
  formData.append('file', file)
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const res = await fetch(
    `${getApiBaseUrl()}/assignments/${assignmentId}/instruction-file`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    },
  )

  const json = (await res.json().catch(() => null)) as {
    data?: Assignment
    message?: string
  } | null

  if (!res.ok) {
    throw new ApiError(res.status, json?.message ?? 'Unable to upload file')
  }
  if (!json?.data) {
    throw new ApiError(res.status, 'Invalid API response')
  }
  return json.data
}

export function useUploadAssignmentInstructionPdf() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      assignmentId: string
      classId: string
      file: File
    }) => {
      void vars.classId
      return uploadAssignmentInstructionPdf(vars.assignmentId, vars.file)
    },
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['assignments', vars.classId] }),
        qc.invalidateQueries({ queryKey: ['assignments-batch'] }),
      ])
    },
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
