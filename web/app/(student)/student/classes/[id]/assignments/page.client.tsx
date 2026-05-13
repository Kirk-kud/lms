'use client'

import { use, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useAssignments } from '@/lib/hooks/useAssignments'
import { useClass } from '@/lib/hooks/useClasses'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { InlineError } from '@/components/ui/shared/InlineError'
import { ApiError } from '@/lib/api'

export default function StudentAssignmentsPageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const router = useRouter()
  const {
    data: classData,
    isLoading: isClassLoading,
    isError: isClassError,
    error: classError,
    refetch: refetchClass,
  } = useClass(classId)
  const {
    data: assignments = [],
    isLoading: isAssignmentsLoading,
    isError: isAssignmentsError,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useAssignments(classId)

  const loadingToastRef = useRef<string | number | null>(null)
  const didSuccessRef = useRef(false)

  useEffect(() => {
    const isLoading = isClassLoading || isAssignmentsLoading
    if (isLoading) {
      if (!loadingToastRef.current) {
        loadingToastRef.current = toast.loading('Loading assignments...')
      }
    } else if (loadingToastRef.current) {
      toast.dismiss(loadingToastRef.current)
      loadingToastRef.current = null
      if (!didSuccessRef.current) {
        didSuccessRef.current = true
        toast.success('Assignments loaded')
      }
    }
  }, [isClassLoading, isAssignmentsLoading])

  const now = useMemo(() => new Date(), [])
  const upcoming = assignments
    .filter((a) => new Date(a.due_date) >= now)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  const past = assignments
    .filter((a) => new Date(a.due_date) < now)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  return (
    <div className="p-4 sm:p-8">
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
        <span className="text-[#111]">Assignments</span>
      </nav>

      <h1 className="text-[20px] font-medium text-[#111] mb-6">Assignments</h1>

      {(isClassError || isAssignmentsError) && (
        <InlineError
          message={
            (classError || assignmentsError) instanceof ApiError
              ? (classError || assignmentsError as ApiError).message
              : 'Unable to load assignments'
          }
          onRetry={() => { refetchClass(); refetchAssignments() }}
        />
      )}

      {(isClassLoading || isAssignmentsLoading) && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      )}

      {!(isClassLoading || isAssignmentsLoading) && assignments.length === 0 && (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5">
              <path d="M5 4h14v16H5z" />
              <path d="M8 2h8v4H8z" />
            </svg>
          }
          title="Nothing here yet"
          description="Your tutor will post work here when the class gets going."
        />
      )}

      {!(isClassLoading || isAssignmentsLoading) && assignments.length > 0 && (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <div className="space-y-2">
                {upcoming.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    title={a.title}
                    description={a.description ?? undefined}
                    dueDate={new Date(a.due_date)}
                    isOverdue={false}
                    submitted={!!a.submission}
                    late={a.submission?.status === 'late'}
                    onClick={() => router.push(`/student/classes/${classId}/assignments/${a.id}`)}
                    onMouseEnter={() => router.prefetch(`/student/classes/${classId}/assignments/${a.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                Earlier
              </h2>
              <div className="space-y-2">
                {past.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    title={a.title}
                    description={a.description ?? undefined}
                    dueDate={new Date(a.due_date)}
                    isOverdue={!a.submission}
                    submitted={!!a.submission}
                    late={a.submission?.status === 'late'}
                    onClick={() => router.push(`/student/classes/${classId}/assignments/${a.id}`)}
                    onMouseEnter={() => router.prefetch(`/student/classes/${classId}/assignments/${a.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function AssignmentCard({
  title,
  description,
  dueDate,
  isOverdue,
  submitted,
  late,
  onClick,
  onMouseEnter,
}: {
  title: string
  description?: string
  dueDate: Date
  isOverdue: boolean
  submitted: boolean
  late: boolean
  onClick: () => void
  onMouseEnter: () => void
}) {
  const statusLabel = submitted ? (late ? 'Late' : 'Submitted') : isOverdue ? 'Overdue' : `Due ${format(dueDate, 'MMM d')}`
  const statusColor = submitted
    ? (late ? '#B6791D' : '#1F8B4C')
    : isOverdue
    ? '#B0182E'
    : '#6B7280'
  const statusBg = submitted
    ? (late ? 'rgba(182,121,29,0.08)' : 'rgba(31,139,76,0.08)')
    : isOverdue
    ? 'rgba(176,24,46,0.08)'
    : 'rgba(107,114,128,0.08)'

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={{ width: '100%', textAlign: 'left' }}
      className="group flex items-center justify-between gap-4 border border-[#E5E5E5] rounded-xl px-5 py-4 hover:border-[#C5A0A8] hover:bg-[#FDFAFA] transition-all"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[#111] truncate group-hover:text-[#8B1A2F] transition-colors">
          {title}
        </p>
        {description && (
          <p className="text-[12px] text-[#6B7280] mt-0.5 line-clamp-1">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          style={{ color: statusColor, backgroundColor: statusBg }}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
        >
          {statusLabel}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className="text-[#9CA3AF] group-hover:text-[#8B1A2F] transition-colors"
        >
          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  )
}
