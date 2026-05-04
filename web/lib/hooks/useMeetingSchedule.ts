'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface MeetingSchedule {
  id: string
  days_of_week: string[]
  time_of_day: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export interface SetMeetingSchedulePayload {
  days_of_week: string[]
  time_of_day: string
  start_date: string
  end_date: string
}

export function useMeetingSchedule() {
  return useQuery({
    queryKey: ['meeting-schedule'],
    queryFn: () => apiClient.get<MeetingSchedule | null>('/meeting-schedule'),
  })
}

export function useSetMeetingSchedule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetMeetingSchedulePayload) =>
      apiClient.put<MeetingSchedule>('/meeting-schedule', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-schedule'] })
    },
  })
}
