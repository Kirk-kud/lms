'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, ApiError } from '@/lib/api'

export interface ModuleItem {
  id: string
  module_id: string
  title: string
  type: 'pdf' | 'video' | 'link' | 'text' | 'image' | 'assignment'
  content_url: string | null
  content_text: string | null
  /** Set when `type` is `assignment` — same class/cohort as the module. */
  assignment_id?: string | null
  order_index: number
  created_at: string
}

export interface CourseModule {
  id: string
  class_id: string
  title: string
  order_index: number
  created_at: string
  items: ModuleItem[]
}

export function useModules(classId: string) {
  return useQuery({
    queryKey: ['modules', classId],
    queryFn: () => apiClient.get<CourseModule[]>(`/modules/class/${classId}`),
    enabled: !!classId,
  })
}

export function useCreateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { class_id: string; title: string; order_index: number }) =>
      apiClient.post<CourseModule>('/modules', body),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ['modules', vars.class_id] })
    },
  })
}

export function useAddModuleItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      moduleId,
      formData,
    }: {
      moduleId: string
      classId: string
      formData: FormData
    }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/modules/${moduleId}/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`,
        },
        body: formData,
      })

      const json = (await res.json().catch(() => null)) as {
        data?: ModuleItem
        message?: string
      } | null

      if (!res.ok) {
        throw new ApiError(res.status, json?.message ?? 'Unable to add item')
      }

      if (!json?.data) {
        throw new ApiError(res.status, 'Invalid API response')
      }

      return json.data
    },
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ['modules', vars.classId] })
    },
  })
}

export function useUpdateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ moduleId, classId: _classId, title }: { moduleId: string; classId: string; title: string }) =>
      apiClient.patch<CourseModule>(`/modules/${moduleId}`, { title }),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ['modules', vars.classId] })
    },
  })
}

export function useUpdateModuleItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      itemId,
      classId: _classId,
      ...body
    }: {
      itemId: string
      classId: string
      title?: string
      content_url?: string
      content_text?: string
      assignment_id?: string
    }) => apiClient.patch<ModuleItem>(`/modules/items/${itemId}`, body),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ['modules', vars.classId] })
    },
  })
}

export function useDeleteModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ moduleId }: { moduleId: string; classId: string }) =>
      apiClient.delete(`/modules/${moduleId}`),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ['modules', vars.classId] })
    },
  })
}

export function useDeleteModuleItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId }: { itemId: string; classId: string }) =>
      apiClient.delete(`/modules/items/${itemId}`),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ['modules', vars.classId] })
    },
  })
}

export function useReorderItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      moduleId,
      items,
    }: {
      moduleId: string
      classId: string
      items: { item_id: string; order_index: number }[]
    }) => apiClient.post<CourseModule>(`/modules/${moduleId}/reorder`, { items }),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ['modules', vars.classId] })
    },
  })
}
