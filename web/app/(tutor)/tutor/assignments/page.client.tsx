'use client'

import { format, isPast } from 'date-fns'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses } from '@/lib/hooks/useClasses'
import { useAssignments } from '@/lib/hooks/useAssignments'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'

export default function TutorAssignmentsClient() {
  const { user } = useUser()
  const { data: classes = [], isLoading: classesLoading } = useClasses(user?.id)
  const cls = classes[0] as (typeof classes[0] & { cohort_name?: string }) | undefined
  const classId = cls?.id ?? ''
  const cohortName = (cls as { cohort_name?: string } | undefined)?.cohort_name ?? 'My Cohort'

  const { data: assignments = [], isLoading } = useAssignments(classId)

  const upcoming = assignments.filter((a) => !isPast(new Date(a.due_date)))
  const past = assignments.filter((a) => isPast(new Date(a.due_date)))

  if (classesLoading || isLoading) {
    return (
      <div className="p-6">
        <SkeletonCard lines={4} />
      </div>
    )
  }

  const AssignmentRow = ({ a }: { a: typeof assignments[0] }) => {
    const overdue = isPast(new Date(a.due_date))
    return (
      <div className="flex items-start justify-between px-4 py-3 border-b border-[#F3F4F6] last:border-0">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[#111] truncate">{a.title}</p>
          {a.description && (
            <p className="text-[12px] text-[#6B7280] mt-0.5 line-clamp-2">{a.description}</p>
          )}
          <p className="text-[11px] mt-1" style={{ color: overdue ? '#991B1B' : '#9CA3AF' }}>
            {overdue ? 'Was due' : 'Due'} {format(new Date(a.due_date), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
          {typeof a.submission_count === 'number' && (
            <span className="text-[11px] font-medium text-[#6B7280]">
              {a.submission_count} submitted
            </span>
          )}
          {typeof a.missing_count === 'number' && a.missing_count > 0 && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#FDE8E8', color: '#991B1B' }}
            >
              {a.missing_count} missing
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF] mb-1">{cohortName}</p>
        <h1 className="text-[28px] font-semibold text-[#111111]">Assignments</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">{assignments.length} total</p>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>}
          title="No assignments yet"
          description="The admin hasn't posted any assignments for this class."
        />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-[#F8F8F8] border-b border-[#E5E5E5]">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF]">Upcoming</p>
              </div>
              {upcoming.map((a) => <AssignmentRow key={a.id} a={a} />)}
            </div>
          )}

          {past.length > 0 && (
            <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-[#F8F8F8] border-b border-[#E5E5E5]">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF]">Past</p>
              </div>
              {past.map((a) => <AssignmentRow key={a.id} a={a} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
