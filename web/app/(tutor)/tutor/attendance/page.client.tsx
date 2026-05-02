'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses } from '@/lib/hooks/useClasses'
import { useAttendanceSessions, useSessionRecords, type SessionRecords } from '@/lib/hooks/useAttendance'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

function useCohortSessionRecords(sessionId: string, cohortId: string) {
  return useQuery({
    queryKey: ['session-records', sessionId, cohortId],
    queryFn: () =>
      apiClient.get<SessionRecords>(`/attendance/sessions/${sessionId}/records?cohort_id=${cohortId}`),
    enabled: !!sessionId && !!cohortId,
  })
}

export default function TutorAttendanceClient() {
  const { user } = useUser()
  const { data: classes = [], isLoading: classesLoading } = useClasses(user?.id)
  const cls = classes[0] as (typeof classes[0] & { cohort_id?: string; cohort_name?: string }) | undefined
  const classId = cls?.id ?? ''
  const cohortId = (cls as { cohort_id?: string } | undefined)?.cohort_id ?? ''
  const cohortName = (cls as { cohort_name?: string } | undefined)?.cohort_name ?? 'My Cohort'

  const { data: sessions = [], isLoading: sessionsLoading } = useAttendanceSessions(classId)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  const { data: records, isLoading: recordsLoading } = useCohortSessionRecords(
    selectedSession ?? '',
    cohortId,
  )

  const isLoading = classesLoading || sessionsLoading

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF] mb-1">{cohortName}</p>
        <h1 className="text-[28px] font-semibold text-[#111111]">Attendance</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">Read-only — filtered to your cohort</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Session list */}
        <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#F8F8F8] border-b border-[#E5E5E5]">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF]">Sessions</p>
          </div>
          {isLoading ? (
            <div className="p-4"><SkeletonCard lines={3} /></div>
          ) : sessions.length === 0 ? (
            <p className="px-4 py-8 text-[13px] text-[#9CA3AF] text-center">No sessions yet.</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s.id === selectedSession ? null : s.id)}
                className={`w-full text-left px-4 py-3 border-b border-[#F3F4F6] last:border-0 transition-colors ${
                  selectedSession === s.id ? 'bg-[#F5E6EA]' : 'hover:bg-[#FAFAFA]'
                }`}
              >
                <p className="text-[13px] font-medium text-[#111]">
                  {format(new Date(s.started_at), 'MMM d, yyyy')}
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                  {format(new Date(s.started_at), 'h:mm a')}
                  {s.is_active && (
                    <span className="ml-2 text-[10px] font-medium text-[#166534] bg-[#DCFCE7] px-1.5 py-0.5 rounded-full">Live</span>
                  )}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Records panel */}
        <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#F8F8F8] border-b border-[#E5E5E5]">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF]">
              {selectedSession ? 'Cohort Records' : 'Select a session'}
            </p>
          </div>

          {!selectedSession ? (
            <p className="px-4 py-8 text-[13px] text-[#9CA3AF] text-center">Click a session to view cohort attendance.</p>
          ) : recordsLoading ? (
            <div className="p-4"><SkeletonCard lines={3} /></div>
          ) : !records ? null : (
            <>
              <div className="px-4 py-2 border-b border-[#F3F4F6] flex gap-4">
                <span className="text-[11px] font-medium text-[#166534]">
                  ✓ {records.present.length} present
                </span>
                <span className="text-[11px] font-medium text-[#991B1B]">
                  ✗ {records.absent.length} absent
                </span>
              </div>
              {records.present.map((r) => (
                <div key={r.student.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-[#F3F4F6] last:border-0">
                  <span className="text-[#166534] text-[12px]">✓</span>
                  <p className="text-[13px] text-[#111]">{r.student.full_name}</p>
                </div>
              ))}
              {records.absent.map((s) => (
                <div key={s.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-[#F3F4F6] last:border-0">
                  <span className="text-[#991B1B] text-[12px]">✗</span>
                  <p className="text-[13px] text-[#6B7280]">{s.full_name}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
