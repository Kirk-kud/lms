'use client'

import { getHours, format, addHours } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses } from '@/lib/hooks/useClasses'
import { useAssignments } from '@/lib/hooks/useAssignments'
import { useModules } from '@/lib/hooks/useModules'
import { useMyAttendance } from '@/lib/hooks/useAttendance'
import { StatCardGrid } from '@/components/ui/shared/StatCard'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { InlineError } from '@/components/ui/shared/InlineError'
import { ApiError } from '@/lib/api'

function greeting(): string {
  const h = getHours(new Date())
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function StudentDashboardPageClient() {
  const router = useRouter()
  const { user } = useUser()
  const {
    data: classes = [],
    isLoading: isClassesLoading,
    isError: isClassesError,
    error: classesError,
    refetch: refetchClasses,
  } = useClasses()
  const primaryClass = classes[0]
  const classId = primaryClass?.id ?? ''

  const {
    data: assignments = [],
    isLoading: isAssignmentsLoading,
    isError: isAssignmentsError,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useAssignments(classId)
  const {
    data: modules = [],
    isLoading: isModulesLoading,
    isError: isModulesError,
    error: modulesError,
    refetch: refetchModules,
  } = useModules(classId)
  const {
    data: attendanceRows = [],
    isLoading: isAttendanceLoading,
    isError: isAttendanceError,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useMyAttendance(classId)

  const firstName = ((user?.user_metadata?.full_name as string) ?? '').split(' ')[0] || 'there'
  const totalSessions = attendanceRows.length
  const presentSessions = attendanceRows.filter((row) => row.present).length
  const attendancePct = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : null
  const submittedCount = assignments.filter((a) => a.submission).length

  const stats = [
    { label: 'My Attendance', value: attendancePct === null ? '--' : `${attendancePct}%`, accentColor: '#8B1A2F' },
    { label: 'Submitted', value: isAssignmentsLoading ? '--' : submittedCount, accentColor: '#8B1A2F' },
    { label: 'Class', value: primaryClass?.title ?? '--', accentColor: '#8B1A2F' },
  ]

  const now = new Date()
  const dueSoon = assignments
    .filter((a) => {
      const due = new Date(a.due_date)
      return due >= now && due <= addHours(now, 48)
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  const recentItems = modules
    .flatMap((m) =>
      m.items.map((item) => ({
        id: item.id,
        title: item.title,
        created_at: item.created_at,
        moduleTitle: m.title,
      }))
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 2)

  const isLoading = isClassesLoading || isAssignmentsLoading || isModulesLoading || isAttendanceLoading
  const hasError = isClassesError || isAssignmentsError || isModulesError || isAttendanceError
  const firstError = classesError || assignmentsError || modulesError || attendanceError
  const handleRetry = () => {
    refetchClasses()
    refetchAssignments()
    refetchModules()
    refetchAttendance()
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-[22px] font-medium text-[#111]">
          {greeting()}, {firstName}
        </h1>
        <p className="text-[13px] text-[#9CA3AF] mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <div className="mb-8">
        <StatCardGrid cards={stats} />
      </div>

      {hasError && (
        <InlineError
          message={firstError instanceof ApiError ? firstError.message : 'Unable to load dashboard'}
          onRetry={handleRetry}
        />
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      )}

      {!isClassesLoading && !primaryClass && (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          }
          title="No class yet"
          description="Join a class to see your upcoming work"
          actionLabel="Join a class"
          onAction={() => router.push('/join')}
        />
      )}

      {!isClassesLoading && primaryClass && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-[#E5E5E5] rounded-xl p-4">
            <h2 className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">
              Up next
            </h2>
            {isLoading ? (
              <SkeletonCard lines={2} />
            ) : dueSoon.length > 0 ? (
              <div className="space-y-2">
                {dueSoon.map((assignment) => (
                  <button
                    key={assignment.id}
                    onClick={() => router.push(`/student/classes/${classId}/assignments`)}
                    className="w-full flex items-center justify-between text-left py-2 px-3 rounded-lg bg-[#F5E6EA] hover:bg-[#EDD8DE] transition-colors"
                  >
                    <div>
                      <p className="text-[13px] text-[#111]">{assignment.title}</p>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                        Due {format(new Date(assignment.due_date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#6B7280] shrink-0 ml-4">
                      {format(new Date(assignment.due_date), 'MMM d')}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#9CA3AF]">No assignments due soon</p>
            )}
          </div>

          <div className="border border-[#E5E5E5] rounded-xl p-4">
            <h2 className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">
              Recent modules
            </h2>
            {isLoading ? (
              <SkeletonCard lines={2} />
            ) : recentItems.length > 0 ? (
              <div className="space-y-2">
                {recentItems.map((item) => (
                  <div key={item.id} className="border border-[#F3F4F6] rounded-lg px-3 py-2">
                    <p className="text-[13px] text-[#111]">{item.title}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                      {item.moduleTitle} • {format(new Date(item.created_at), 'MMM d')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#9CA3AF]">No recent modules yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
