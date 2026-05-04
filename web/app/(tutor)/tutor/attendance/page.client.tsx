'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useTutorClass } from '@/lib/contexts/TutorClassContext'
import { useAttendanceSessions, useManualCheckIn, type SessionRecords } from '@/lib/hooks/useAttendance'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { ApiError, apiClient } from '@/lib/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'

function useCohortSessionRecords(sessionId: string, cohortId: string) {
  return useQuery({
    queryKey: ['session-records', sessionId, cohortId],
    queryFn: () =>
      apiClient.get<SessionRecords>(`/attendance/sessions/${sessionId}/records?cohort_id=${cohortId}`),
    enabled: !!sessionId && !!cohortId,
  })
}

function AbsentStudentRow({
  student,
  sessionId,
}: {
  student: { id: string; full_name: string; email: string }
  sessionId: string
}) {
  const qc = useQueryClient()
  const manualCheckIn = useManualCheckIn(sessionId)
  const [marking, setMarking] = useState(false)

  const handleMark = async () => {
    setMarking(true)
    try {
      await manualCheckIn.mutateAsync(student.id)
      await qc.invalidateQueries({ queryKey: ['session-records'] })
      toast.success(`${student.full_name} marked present`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to mark present')
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-[#F3F4F6] last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[#991B1B] text-[12px] shrink-0">✗</span>
        <p className="text-[13px] text-[#6B7280] truncate">{student.full_name}</p>
      </div>
      <button
        onClick={handleMark}
        disabled={marking}
        className="text-[11px] font-medium text-[#8B1A2F] hover:underline disabled:opacity-50 shrink-0"
      >
        {marking ? 'Marking…' : 'Mark present'}
      </button>
    </div>
  )
}

export default function TutorAttendanceClient() {
  const { selectedClass, cohortId } = useTutorClass()
  const classId = selectedClass?.id ?? ''
  const cohortName = selectedClass?.cohort_name ?? 'My Cohort'

  const { data: sessions = [], isLoading: sessionsLoading } = useAttendanceSessions(classId)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  const { data: records, isLoading: recordsLoading } = useCohortSessionRecords(
    selectedSession ?? '',
    cohortId ?? '',
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF] mb-1">{cohortName}</p>
        <h1 className="text-[28px] font-semibold text-[#111111]">Attendance</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">Filtered to your cohort</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Session list */}
        <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#F8F8F8] border-b border-[#E5E5E5]">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF]">Sessions</p>
          </div>
          {sessionsLoading ? (
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
                  <span className="text-[#166534] text-[12px] shrink-0">✓</span>
                  <p className="text-[13px] text-[#111]">{r.student.full_name}</p>
                </div>
              ))}
              {records.absent.map((s) => (
                <AbsentStudentRow
                  key={s.id}
                  student={s}
                  sessionId={selectedSession}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
