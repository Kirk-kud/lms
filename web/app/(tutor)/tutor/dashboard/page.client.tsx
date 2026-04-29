'use client'

import { getHours, format, isPast } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses, ClassRecord } from '@/lib/hooks/useClasses'
import { useAssignments, Assignment } from '@/lib/hooks/useAssignments'
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

function ClassUpcomingRows({ classId, classTitle, onNavigate }: { classId: string; classTitle: string; onNavigate: (href: string) => void }) {
  const { data: assignments = [], isLoading } = useAssignments(classId)
  if (isLoading) return <SkeletonCard lines={2} />

  const upcoming = assignments
    .filter((a) => !isPast(new Date(a.due_date)))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3)

  if (!upcoming.length) return null

  return (
    <>
      {upcoming.map((a) => (
        <button
          key={a.id}
          onClick={() => onNavigate(`/tutor/classes/${classId}/assignments`)}
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

function ClassSubmissionRows({ classId, classTitle, onNavigate }: { classId: string; classTitle: string; onNavigate: (href: string) => void }) {
  const { data: assignments = [] } = useAssignments(classId)

  const recent = assignments
    .filter((a): a is Assignment & { submission_count: number } => (a.submission_count ?? 0) > 0)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  if (!recent.length) return null

  return (
    <>
      {recent.map((a) => (
        <button
          key={a.id}
          onClick={() => onNavigate(`/tutor/classes/${classId}/assignments`)}
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

  const firstName = ((user?.user_metadata?.full_name as string) ?? '').split(' ')[0] || 'there'
  const totalStudents = classes.reduce((sum, c) => sum + (c.enrolled_count ?? 0), 0)

  const stats = [
    { label: 'Total Students', value: isLoading ? '--' : totalStudents, accentColor: '#8B1A2F' },
    { label: 'Active Classes', value: isLoading ? '--' : classes.length, accentColor: '#8B1A2F' },
    { label: 'Meets', value: 'Tue & Thu', accentColor: '#8B1A2F' },
  ]

  const hasClasses = classes.length > 0

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

      {isError && (
        <InlineError
          message={error instanceof ApiError ? error.message : 'Unable to load dashboard'}
          onRetry={() => refetch()}
        />
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-[#E5E5E5] rounded-xl p-4">
            <h2 className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">
              Upcoming
            </h2>
            {hasClasses ? (
              classes.map((c) => (
                <ClassUpcomingRows
                  key={c.id}
                  classId={c.id}
                  classTitle={c.title}
                  onNavigate={router.push}
                />
              ))
            ) : (
              <p className="text-[13px] text-[#9CA3AF]">No upcoming assignments</p>
            )}
          </div>

          <div className="border border-[#E5E5E5] rounded-xl p-4">
            <h2 className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">
              Recent Submissions
            </h2>
            {hasClasses ? (
              classes.map((c) => (
                <ClassSubmissionRows
                  key={c.id}
                  classId={c.id}
                  classTitle={c.title}
                  onNavigate={router.push}
                />
              ))
            ) : (
              <p className="text-[13px] text-[#9CA3AF]">No submissions yet</p>
            )}
          </div>
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
          description="Create your first class to get started"
          actionLabel="Go to Classes"
          onAction={() => router.push('/tutor/classes')}
        />
      )}
    </div>
  )
}
