'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useMyAttendance } from '@/lib/hooks/useAttendance'
import { useClass } from '@/lib/hooks/useClasses'
import { apiClient, ApiError } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import AttendanceCheckIn from '@/components/ui/student/AttendanceCheckIn'
import { StatusBadge } from '@/components/ui/shared/Badge'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { InlineError } from '@/components/ui/shared/InlineError'
import { toast } from 'sonner'

export default function StudentAttendancePageClient({ params }: { params: Promise<{ id: string }> }) {
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
  const {
    data: attendanceRows = [],
    isLoading: isAttendanceLoading,
    isError: isAttendanceError,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useMyAttendance(classId)
  const [sessionActive, setSessionActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const expiredSessionRef = useRef<string | null>(null)

  const loadingToastRef = useRef<string | number | null>(null)
  const didSuccessRef = useRef(false)

  useEffect(() => {
    router.prefetch(`/student/classes/${classId}/assignments`)
    router.prefetch(`/student/classes/${classId}/modules`)
  }, [classId, router])

  useEffect(() => {
    const isLoading = isClassLoading || isAttendanceLoading
    if (isLoading) {
      if (!loadingToastRef.current) {
        loadingToastRef.current = toast.loading('Loading attendance...')
      }
    } else if (loadingToastRef.current) {
      toast.dismiss(loadingToastRef.current)
      loadingToastRef.current = null
      if (!didSuccessRef.current) {
        didSuccessRef.current = true
        toast.success('Attendance loaded')
      }
    }
  }, [isClassLoading, isAttendanceLoading])

  const activeRow = attendanceRows.find((row) => row.session.is_active)
  const checkedInAt = activeRow?.checked_in_at ? new Date(activeRow.checked_in_at) : undefined

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSessionActive(Boolean(activeRow?.session?.is_active))
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [activeRow?.session?.id, activeRow?.session?.is_active])

  useEffect(() => {
    if (!activeRow?.session?.expires_at) return
    const expiresAt = new Date(activeRow.session.expires_at).getTime()
    const sessionId = activeRow.session.id
    const now = Date.now()
    const ms = expiresAt - now

    if (ms <= 0) {
      if (expiredSessionRef.current !== sessionId) {
        expiredSessionRef.current = sessionId
        toast.error('Session has expired')
        setSessionActive(false)
      }
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (expiredSessionRef.current !== sessionId) {
        expiredSessionRef.current = sessionId
        toast.error('Session has expired')
        setSessionActive(false)
      }
    }, ms)

    return () => window.clearTimeout(timeoutId)
  }, [activeRow?.session?.expires_at, activeRow?.session?.id])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`attendance:${classId}`)
      .on('broadcast', { event: 'session_started' }, () => {
        setSessionActive(true)
        refetchAttendance()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [classId, refetchAttendance])

  useEffect(() => {
    if (!classId) return
    const id = setInterval(() => {
      refetchAttendance()
    }, 30000)
    return () => clearInterval(id)
  }, [classId, refetchAttendance])

  const handleSubmitPin = async (pin: string) => {
    setIsSubmitting(true)
    try {
      await apiClient.post('/attendance/checkin', { pin_code: pin, class_id: classId })
      await qc.invalidateQueries({ queryKey: ['my-attendance', classId] })
      toast.success("You're checked in")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to check in')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <nav className="flex items-center gap-2 text-[12px] text-[#9CA3AF] mb-6">
        <button
          onClick={() => router.push('/student/dashboard')}
          onMouseEnter={() => router.prefetch('/student/dashboard')}
          className="hover:text-[#111] transition-colors"
        >
          Dashboard
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/student/classes/${classId}/modules`)}
          onMouseEnter={() => router.prefetch(`/student/classes/${classId}/modules`)}
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
      </div>

      <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
        <AttendanceCheckIn
          sessionActive={sessionActive}
          onSubmitPin={handleSubmitPin}
          checkedInAt={checkedInAt}
        />
        {isSubmitting && (
          <div className="px-5 pb-4 text-[12px] text-[#9CA3AF]">Submitting check-in...</div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">
          Personal record
        </h2>

        {(isClassError || isAttendanceError) && (
          <InlineError
            message={
              (classError || attendanceError) instanceof ApiError
                ? (classError || attendanceError as ApiError).message
                : 'Unable to load attendance'
            }
            onRetry={() => {
              refetchClass()
              refetchAttendance()
            }}
          />
        )}

        {(isClassLoading || isAttendanceLoading) && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
          </div>
        )}

        {!(isClassLoading || isAttendanceLoading) && attendanceRows.length === 0 && (
          <p className="text-[13px] text-[#9CA3AF]">No attendance records yet</p>
        )}

        {!(isClassLoading || isAttendanceLoading) && attendanceRows.length > 0 && (
          <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 text-[11px] uppercase tracking-wider text-[#9CA3AF] bg-[#FAFAFA] px-4 py-2">
              <span>Date</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-[#F3F4F6]">
              {attendanceRows
                .sort((a, b) => new Date(b.session.started_at).getTime() - new Date(a.session.started_at).getTime())
                .map((row) => (
                  <div key={row.session.id} className="grid grid-cols-2 px-4 py-3 text-[13px]">
                    <span className="text-[#111]">
                      {format(new Date(row.session.started_at), 'MMM d, yyyy')}
                    </span>
                    <span>
                      <StatusBadge
                        variant={row.present ? 'success' : 'danger'}
                        label={row.present ? 'Present' : 'Absent'}
                      />
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
