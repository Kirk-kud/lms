'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface CohortTa {
  id: string
  full_name: string
  email: string
  role: string
}

export interface Cohort {
  id: string
  class_id: string
  name: string
  zoom_link: string | null
  invite_pin: string | null
  can_edit_modules: boolean
  created_at: string
  ta: CohortTa | null
}

export interface CohortStudent {
  id: string
  enrolled_at: string
  student: {
    id: string
    full_name: string
    email: string
    role: string
  }
}

export function useCohorts(classId: string) {
  return useQuery({
    queryKey: ['cohorts', classId],
    queryFn: () => apiClient.get<Cohort[]>(`/cohorts?class_id=${classId}`),
    enabled: !!classId,
  })
}

export function useCohort(cohortId: string) {
  return useQuery({
    queryKey: ['cohort', cohortId],
    queryFn: () => apiClient.get<Cohort>(`/cohorts/${cohortId}`),
    enabled: !!cohortId,
  })
}

export function useCohortStudents(cohortId: string) {
  return useQuery({
    queryKey: ['cohort-students', cohortId],
    queryFn: () => apiClient.get<CohortStudent[]>(`/cohorts/${cohortId}/students`),
    enabled: !!cohortId,
  })
}

export function useCreateCohort() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { class_id: string; name: string; ta_id?: string; zoom_link?: string; invite_pin?: string }) =>
      apiClient.post<Cohort>('/cohorts', body),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['cohorts', vars.class_id] }),
        qc.invalidateQueries({ queryKey: ['classes'] }),
        qc.invalidateQueries({ queryKey: ['classes', vars.class_id] }),
      ])
    },
  })
}

export function useUpdateCohort(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; ta_id?: string; zoom_link?: string; invite_pin?: string; can_edit_modules?: boolean }) =>
      apiClient.patch<Cohort>(`/cohorts/${id}`, body),
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['cohorts', classId] }),
        qc.invalidateQueries({ queryKey: ['cohort', vars.id] }),
        qc.invalidateQueries({ queryKey: ['classes', classId] }),
      ])
    },
  })
}

export function useDeleteCohort(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/cohorts/${id}`),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['cohorts', classId] }),
        qc.invalidateQueries({ queryKey: ['classes'] }),
        qc.invalidateQueries({ queryKey: ['classes', classId] }),
      ])
    },
  })
}

export function useAddCohortStudent(cohortId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (student_id: string) =>
      apiClient.post(`/cohorts/${cohortId}/students`, { student_id }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['cohort-students', cohortId] }),
        qc.invalidateQueries({ queryKey: ['classes'] }),
        qc.invalidateQueries({ queryKey: ['roster'] }),
      ])
    },
  })
}

export function useRemoveCohortStudent(cohortId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (studentId: string) =>
      apiClient.delete(`/cohorts/${cohortId}/students/${studentId}`),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['cohort-students', cohortId] }),
        qc.invalidateQueries({ queryKey: ['classes'] }),
        qc.invalidateQueries({ queryKey: ['roster'] }),
      ])
    },
  })
}

export function useRegenerateInviteCode(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cohortId: string) =>
      apiClient.post<Cohort>(`/cohorts/${cohortId}/regenerate-code`, {}),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['cohorts', classId] })
    },
  })
}
