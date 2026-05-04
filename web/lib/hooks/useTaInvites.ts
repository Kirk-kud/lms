'use client'

import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export function useCreateTaInvite() {
  return useMutation({
    mutationFn: (body: { cohort_id?: string; email?: string }) =>
      apiClient.post<{ code: string }>('/ta-invites', body),
  })
}
