'use client'

import { useMemo, useState } from 'react'
import { getHours, format, isPast } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses, type ClassRecord } from '@/lib/hooks/useClasses'
import { useAssignmentsBatch } from '@/lib/hooks/useAssignments'
import { StatCardGrid } from '@/components/ui/shared/StatCard'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { InlineError } from '@/components/ui/shared/InlineError'
import { ApiError } from '@/lib/api'
import type { Assignment } from '@/lib/hooks/useAssignments'

function greeting(): string {
  const h = getHours(new Date())
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Class card (dashboard version) ──────────────────────────────────────────

function ClassSummaryCard({ cls }: { cls: ClassRecord }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => router.push(`/admin/classes/${cls.id}/cohorts`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `0.5px solid ${hovered ? '#8B1A2F44' : '#E5E5E5'}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        backgroundColor: hovered ? '#FAFAFA' : '#FFFFFF',
        transition: 'border-color 150ms ease, background-color 150ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cls.title}
          </p>
          {cls.description && (
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {cls.description}
            </p>
          )}
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '2px', color: hovered ? '#8B1A2F' : '#D1D5DB', transition: 'color 150ms ease' }}>
          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Students</p>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: '1px 0 0' }}>{cls.enrolled_count}</p>
        </div>
        {cls.cohort_count !== undefined && (
          <div>
            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cohorts</p>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', margin: '1px 0 0' }}>{cls.cohort_count}</p>
          </div>
        )}
        {cls.tutor && (
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin</p>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#111111', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cls.tutor.full_name}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Per-class row components ─────────────────────────────────────────────────

function UpcomingRows({
  classId,
  classTitle,
  assignments,
  isLoading,
  onNavigate,
}: {
  classId: string
  classTitle: string
  assignments: Assignment[]
  isLoading: boolean
  onNavigate: (href: string) => void
}) {
  const upcoming = assignments
    .filter((a) => !isPast(new Date(a.due_date)))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3)

  if (isLoading) return <SkeletonCard lines={2} />
  if (!upcoming.length) return null

  return (
    <>
      {upcoming.map((a) => (
        <button
          key={a.id}
          onClick={() => onNavigate(`/admin/classes/${classId}/assignments`)}
          className="w-full flex items-center justify-between py-2.5 border-b border-[#F3F4F6] last:border-0 text-left hover:bg-[#FAFAFA] -mx-4 px-4 transition-colors"
        >
          <div>
            <p className="text-[13px] text-[#111]">{a.title}</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">{classTitle}</p>
          </div>
          <span className="text-[11px] text-[#6B7280] shrink-0 ml-4">
            {format(new Date(a.due_date), 'MMM d')}
          </span>
        </button>
      ))}
    </>
  )
}

function SubmissionRows({
  classId,
  classTitle,
  assignments,
  isLoading,
  onNavigate,
}: {
  classId: string
  classTitle: string
  assignments: Assignment[]
  isLoading: boolean
  onNavigate: (href: string) => void
}) {
  const recent = assignments
    .filter((a): a is Assignment & { submission_count: number } => (a.submission_count ?? 0) > 0)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  if (isLoading) return <SkeletonCard lines={2} />
  if (!recent.length) return null

  return (
    <>
      {recent.map((a) => (
        <button
          key={a.id}
          onClick={() => onNavigate(`/admin/classes/${classId}/assignments`)}
          className="w-full flex items-center justify-between py-2.5 border-b border-[#F3F4F6] last:border-0 text-left hover:bg-[#FAFAFA] -mx-4 px-4 transition-colors"
        >
          <div>
            <p className="text-[13px] text-[#111]">{a.title}</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">{classTitle}</p>
          </div>
          <span className="text-[11px] font-medium text-[#8B1A2F] shrink-0 ml-4">
            {a.submission_count} submitted
          </span>
        </button>
      ))}
    </>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPageClient() {
  const router = useRouter()
  const { user } = useUser()
  const {
    data: classes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useClasses()
  const classIds = useMemo(() => classes.map((c) => c.id), [classes])
  const {
    data: assignmentsByClass = {},
    isLoading: isAssignmentsLoading,
  } = useAssignmentsBatch(classIds)

  const firstName     = ((user?.user_metadata?.full_name as string) ?? '').split(' ')[0] || 'there'
  const totalStudents = classes.reduce((sum, c) => sum + (c.enrolled_count ?? 0), 0)

  const stats = [
    { label: 'Total Students', value: isLoading ? '--' : totalStudents,  accentColor: '#8B1A2F' },
    { label: 'Active Classes', value: isLoading ? '--' : classes.length, accentColor: '#8B1A2F' },
    { label: 'Meets',          value: 'Mon & Wed',                       accentColor: '#8B1A2F' },
  ]

  const hasClasses           = classes.length > 0
  const totalUpcoming = classes.reduce(
    (sum, c) =>
      sum +
      (assignmentsByClass[c.id] ?? []).filter(
        (a) => !isPast(new Date(a.due_date)),
      ).length,
    0,
  )
  const totalSubmissions = classes.reduce(
    (sum, c) =>
      sum +
      (assignmentsByClass[c.id] ?? []).filter(
        (a) => (a.submission_count ?? 0) > 0,
      ).length,
    0,
  )

  return (
    <div className="w-full p-6 md:p-8">

      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-[22px] font-medium text-[#111]">
          {greeting()}, {firstName}
        </h1>
        <p className="text-[13px] text-[#9CA3AF] mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <StatCardGrid cards={stats} />
      </div>

      {isError && (
        <InlineError
          message={error instanceof ApiError ? error.message : 'Unable to load dashboard'}
          onRetry={() => refetch()}
        />
      )}

      {/* Upcoming + Submissions */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      )}

      {!isLoading && !hasClasses && (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          }
          title="No classes yet"
          description="Create your first class from the Courses page"
          actionLabel="Go to Courses"
          onAction={() => router.push('/admin/classes')}
        />
      )}

      {!isLoading && hasClasses && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="border border-[#E5E5E5] rounded-xl p-4">
            <h2 className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">Upcoming</h2>
            {classes.map((c) => (
              <UpcomingRows
                key={c.id}
                classId={c.id}
                classTitle={c.title}
                assignments={assignmentsByClass[c.id] ?? []}
                isLoading={isAssignmentsLoading}
                onNavigate={router.push}
              />
            ))}
            {!isAssignmentsLoading && totalUpcoming === 0 && (
              <p className="text-[13px] text-[#9CA3AF]">No upcoming assignments</p>
            )}
          </div>

          <div className="border border-[#E5E5E5] rounded-xl p-4">
            <h2 className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">Recent Submissions</h2>
            {classes.map((c) => (
              <SubmissionRows
                key={c.id}
                classId={c.id}
                classTitle={c.title}
                assignments={assignmentsByClass[c.id] ?? []}
                isLoading={isAssignmentsLoading}
                onNavigate={router.push}
              />
            ))}
            {!isAssignmentsLoading && totalSubmissions === 0 && (
              <p className="text-[13px] text-[#9CA3AF]">No submissions yet</p>
            )}
          </div>
        </div>
      )}

      {/* All Classes */}
      {!isLoading && hasClasses && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              All Classes
            </h2>
            <button
              onClick={() => router.push('/admin/classes')}
              style={{ fontSize: '12px', color: '#8B1A2F', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <ClassSummaryCard key={cls.id} cls={cls} />
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div>
          <div style={{ height: '16px', width: '80px', backgroundColor: '#F0F0F0', borderRadius: '4px', marginBottom: '16px' }} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
          </div>
        </div>
      )}

    </div>
  )
}
