'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface ModuleItem {
  id: string
  module_id: string
  title: string
  type: 'pdf' | 'video' | 'link' | 'text'
  content_url: string | null
  content_text: string | null
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
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['modules', vars.class_id] }),
  })
}

export function useAddModuleItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      moduleId,
      classId: _classId,
      formData,
    }: {
      moduleId: string
      classId: string
      formData: FormData
    }) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/modules/${moduleId}/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`,
        },
        body: formData,
      })
        .then((r) => r.json())
        .then((j) => j.data as ModuleItem),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['modules', vars.classId] }),
  })
}

export function useDeleteModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ moduleId }: { moduleId: string; classId: string }) =>
      apiClient.delete(`/modules/${moduleId}`),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['modules', vars.classId] }),
  })
}

export function useDeleteModuleItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId }: { itemId: string; classId: string }) =>
      apiClient.delete(`/modules/items/${itemId}`),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['modules', vars.classId] }),
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
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['modules', vars.classId] }),
  })
}
