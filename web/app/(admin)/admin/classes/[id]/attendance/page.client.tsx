'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  useAttendanceSessions,
  useStartSession,
  useEndSession,
  useSessionRecords,
  useManualCheckIn,
  useDeleteSession,
  useMarkAbsent,
  useRestartSession,
  AttendanceSession,
} from '@/lib/hooks/useAttendance'
import { useClass } from '@/lib/hooks/useClasses'
import { useRoster } from '@/lib/hooks/useClasses'
import AttendancePinDisplay from '@/components/ui/tutor/AttendancePinDisplay'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { InlineError } from '@/components/ui/shared/InlineError'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'

function SessionHistoryRow({
  session,
  classId,
  duration,
  onDeleted,
}: {
  session: AttendanceSession
  classId: string
  duration: number
  onDeleted: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { data: records, refetch: refetchRecords } = useSessionRecords(expanded ? session.id : '')
  const manualCheckIn = useManualCheckIn(session.id)
  const markAbsent = useMarkAbsent(session.id)
  const deleteSession = useDeleteSession()
  const restartSession = useRestartSession()
  const [actingStudentId, setActingStudentId] = useState<string | null>(null)

  const handleMarkPresent = async (studentId: string, studentName: string) => {
    setActingStudentId(studentId)
    try {
      await manualCheckIn.mutateAsync(studentId)
      await refetchRecords()
      toast.success(`${studentName} marked present`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to mark student present')
    } finally {
      setActingStudentId(null)
    }
  }

  const handleMarkAbsent = async (studentId: string, studentName: string) => {
    setActingStudentId(studentId)
    try {
      await markAbsent.mutateAsync(studentId)
      await refetchRecords()
      toast.success(`${studentName} marked absent`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to mark student absent')
    } finally {
      setActingStudentId(null)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteSession.mutateAsync({ sessionId: session.id, classId })
      toast.success('Session deleted')
      onDeleted()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to delete session')
    } finally {
      setConfirmDelete(false)
    }
  }

  const handleRestart = async () => {
    try {
      await restartSession.mutateAsync({ sessionId: session.id, classId, duration_minutes: duration })
      toast.success(`Session restarted for ${duration} min`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to restart session')
    }
  }

  return (
    <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
      <div className="flex items-center">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center justify-between px-5 py-4 hover:bg-[#FAFAFA] transition-colors text-left"
        >
          <div>
            <p className="text-[13px] font-medium text-[#111]">
              {format(new Date(session.started_at), 'EEEE, MMM d, yyyy')}
            </p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              {format(new Date(session.started_at), 'h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[13px] font-medium text-[#111]">{session.present_count ?? 0}</span>
              <span className="text-[11px] text-[#9CA3AF]"> present</span>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        {/* Restart button */}
        <div className="px-2 border-l border-[#F3F4F6]">
          <button
            onClick={handleRestart}
            disabled={restartSession.isPending}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#ECFDF5] text-[#9CA3AF] hover:text-[#059669] transition-colors"
            title="Restart session"
          >
            {restartSession.isPending
              ? <LoadingSpinner />
              : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
                </svg>
              )
            }
          </button>
        </div>

        {/* Delete button */}
        <div className="px-3 border-l border-[#F3F4F6]">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#9CA3AF]">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleteSession.isPending}
                className="text-[11px] font-medium text-white bg-[#8B1A2F] rounded-md px-2 py-1 transition-colors flex items-center gap-1"
              >
                {deleteSession.isPending ? <LoadingSpinner className="text-white" /> : null}
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[11px] text-[#6B7280] border border-[#E5E5E5] rounded-md px-2 py-1 hover:bg-[#F8F8F8] transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FEE2E2] text-[#9CA3AF] hover:text-[#8B1A2F] transition-colors"
              title="Delete session"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {expanded && records && (
        <div className="border-t border-[#F3F4F6] px-5 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
            <div>
              <p className="text-[11px] font-medium text-[#166534] uppercase tracking-wider mb-2">
                Present ({records.present.length})
              </p>
              {records.present.map((r) => (
                <div key={r.student.id} className="flex items-center justify-between gap-2 py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[9px] font-medium text-[#166534] shrink-0">
                      {r.student.avatar_initials}
                    </div>
                    <span className="text-[12px] text-[#111] truncate">{r.student.full_name}</span>
                  </div>
                  <button
                    onClick={() => handleMarkAbsent(r.student.id, r.student.full_name)}
                    disabled={actingStudentId === r.student.id}
                    className="text-[11px] text-[#6B7280] hover:text-[#8B1A2F] border border-[#E5E5E5] rounded-md px-2 py-0.5 transition-colors shrink-0 flex items-center gap-1"
                  >
                    {actingStudentId === r.student.id ? <LoadingSpinner /> : null}
                    Mark absent
                  </button>
                </div>
              ))}
              {records.present.length === 0 && (
                <p className="text-[12px] text-[#9CA3AF]">No one checked in</p>
              )}
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#991B1B] uppercase tracking-wider mb-2">
                Absent ({records.absent.length})
              </p>
              {records.absent.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[9px] font-medium text-[#991B1B] shrink-0">
                      {s.avatar_initials}
                    </div>
                    <span className="text-[12px] text-[#111] truncate">{s.full_name}</span>
                  </div>
                  <button
                    onClick={() => handleMarkPresent(s.id, s.full_name)}
                    disabled={actingStudentId === s.id}
                    className="text-[11px] text-[#6B7280] hover:text-[#166534] border border-[#E5E5E5] rounded-md px-2 py-0.5 transition-colors shrink-0 flex items-center gap-1"
                  >
                    {actingStudentId === s.id ? <LoadingSpinner /> : null}
                    Mark present
                  </button>
                </div>
              ))}
              {records.absent.length === 0 && (
                <p className="text-[12px] text-[#9CA3AF]">Everyone was present</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AttendancePageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const {
    data: classData,
    isLoading: isClassLoading,
    isError: isClassError,
    error: classError,
    refetch: refetchClass,
  } = useClass(classId)
  const { data: roster } = useRoster(classId)
  const {
    data: sessions = [],
    isLoading: isAttendanceLoading,
    isError,
    error,
    refetch,
  } = useAttendanceSessions(classId)
  const startSession = useStartSession()
  const endSession = useEndSession()
  const [duration, setDuration] = useState(10)

  const totalStudents = roster?.length ?? 0
  const activeSession = sessions.find((s) => s.is_active) ?? null

  const toastIdRef = useRef<string | number | null>(null)
  const didSuccessRef = useRef(false)

  useEffect(() => {
    router.prefetch(`/admin/classes/${classId}/assignments`)
    router.prefetch(`/admin/classes/${classId}/roster`)
    router.prefetch(`/admin/classes/${classId}/modules`)
  }, [classId, router])

  useEffect(() => {
    const isLoading = isClassLoading || isAttendanceLoading
    if (isLoading) {
      if (!toastIdRef.current) {
        toastIdRef.current = toast.loading('Loading attendance...')
      }
    } else if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
      if (!didSuccessRef.current) {
        didSuccessRef.current = true
        toast.success('Attendance loaded')
      }
    }
  }, [isClassLoading, isAttendanceLoading])

  useEffect(() => {
    if (!activeSession) return
    const supabase = createClient()
    const channel = supabase
      .channel(`attendance-session-${activeSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
          filter: `session_id=eq.${activeSession.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['attendance-sessions', classId] })
          qc.invalidateQueries({ queryKey: ['session-records', activeSession.id] })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeSession, classId, qc])

  const handleStartSession = async () => {
    try {
      await startSession.mutateAsync({ class_id: classId, duration_minutes: duration })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to start session')
    }
  }

  const handleEndSession = async () => {
    if (!activeSession) return
    try {
      await endSession.mutateAsync({ sessionId: activeSession.id, classId })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to end session')
    }
  }

  if (activeSession) {
    return (
      <AttendancePinDisplay
        pin={activeSession.pin_code}
        expiresAt={new Date(activeSession.expires_at)}
        checkedIn={activeSession.present_count ?? 0}
        total={totalStudents}
        onEndSession={handleEndSession}
      />
    )
  }

  const pastSessions = sessions.filter((s) => !s.is_active)

  return (
    <div className="p-4 sm:p-8">
      <nav className="flex items-center gap-2 text-[12px] text-[#9CA3AF] mb-6">
        <button
          onClick={() => router.push('/admin/classes')}
          onMouseEnter={() => router.prefetch('/admin/classes')}
          className="hover:text-[#111] transition-colors"
        >
          Classes
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/admin/classes/${classId}/modules`)}
          onMouseEnter={() => router.prefetch(`/admin/classes/${classId}/modules`)}
          className="hover:text-[#111] transition-colors"
        >
          {isClassLoading ? (
            <span className="inline-block w-24 h-3 bg-[#E5E5E5] rounded animate-pulse align-middle" />
          ) : (
            classData?.title ?? '...'
          )}
        </button>
        <span>/</span>
        <span className="text-[#111]">Attendance</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-medium text-[#111]">Attendance</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-[#E5E5E5] rounded-lg overflow-hidden h-9">
            {[5, 10, 15, 20, 30].map((min) => (
              <button
                key={min}
                onClick={() => setDuration(min)}
                className={`px-2.5 h-full text-[12px] transition-colors ${
                  duration === min
                    ? 'bg-[#111] text-white font-medium'
                    : 'text-[#6B7280] hover:bg-[#F8F8F8]'
                }`}
              >
                {min}m
              </button>
            ))}
          </div>
          <button
            onClick={handleStartSession}
            disabled={startSession.isPending}
            className="h-9 px-4 text-[13px] font-medium bg-[#8B1A2F] text-white rounded-lg hover:bg-[#7a1728] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {startSession.isPending && <LoadingSpinner className="text-white" />}
            {startSession.isPending ? 'Starting...' : 'Start session'}
          </button>
        </div>
      </div>

      {(isClassError || isError) && (
        <InlineError
          message={
            (classError || error) instanceof ApiError
              ? (classError || error as ApiError).message
              : 'Unable to load attendance'
          }
          onRetry={() => {
            refetchClass()
            refetch()
          }}
        />
      )}

      {(isClassLoading || isAttendanceLoading) && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      )}

      {!(isClassLoading || isAttendanceLoading) && pastSessions.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-[#F8F8F8] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-[#111]">No sessions yet</p>
          <p className="text-[13px] text-[#9CA3AF] mt-1">Start a session to track attendance</p>
        </div>
      )}

      {!(isClassLoading || isAttendanceLoading) && pastSessions.length > 0 && (
        <div className="space-y-3">
          <p className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-4">
            Session History
          </p>
          {pastSessions
            .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
            .map((session) => (
              <SessionHistoryRow
                key={session.id}
                session={session}
                classId={classId}
                duration={duration}
                onDeleted={() => refetch()}
              />
            ))}
        </div>
      )}
    </div>
  )
}
