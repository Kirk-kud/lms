'use client'

import { getHours, format, isPast } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses } from '@/lib/hooks/useClasses'
import { useCohortStudents } from '@/lib/hooks/useCohorts'
import { useAssignments } from '@/lib/hooks/useAssignments'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'

function greeting(): string {
  const h = getHours(new Date())
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#F8F8F8] rounded-xl p-4 border border-[#E5E5E5]">
      <p className="text-tiny uppercase tracking-widest text-[#9CA3AF] mb-1">{label}</p>
      <p className="text-[24px] font-semibold text-[#8B1A2F]">{value}</p>
    </div>
  )
}

export default function TutorDashboardClient() {
  const router = useRouter()
  const { user } = useUser()
  const { data: classes = [], isLoading: classesLoading } = useClasses(user?.id)

  const cls = classes[0] as (typeof classes[0] & { cohort_id?: string; cohort_name?: string }) | undefined
  const classId = cls?.id ?? ''
  const cohortId = (cls as { cohort_id?: string } | undefined)?.cohort_id ?? ''
  const cohortName = (cls as { cohort_name?: string } | undefined)?.cohort_name ?? 'My Cohort'

  const { data: students = [], isLoading: studentsLoading } = useCohortStudents(cohortId)
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments(classId)

  const firstName = ((user?.user_metadata?.full_name as string) ?? '').split(' ')[0]

  const upcoming = assignments
    .filter((a) => !isPast(new Date(a.due_date)))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 4)

  const isLoading = classesLoading || studentsLoading || assignmentsLoading

  return (
    <div className="p-6 max-w-3xl">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF] mb-1">
        {greeting()},
      </p>
      <h1 className="text-[28px] font-semibold text-[#111111] mb-1">{firstName}.</h1>
      {cls && (
        <p className="text-[13px] text-[#6B7280] mb-8">
          {cls.title} · {cohortName}
        </p>
      )}

      {isLoading ? (
        <SkeletonCard lines={3} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Students" value={students.length} />
            <StatCard label="Assignments" value={assignments.length} />
            <StatCard label="Upcoming due" value={upcoming.length} />
          </div>

          <div className="border border-[#E5E5E5] rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-[#E5E5E5] bg-[#F8F8F8]">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF]">Upcoming Assignments</p>
            </div>
            {upcoming.length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-[#9CA3AF]">No upcoming assignments.</p>
            ) : (
              upcoming.map((a) => (
                <button
                  key={a.id}
                  onClick={() => router.push('/tutor/assignments')}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6] last:border-0 text-left hover:bg-[#FAFAFA] transition-colors"
                >
                  <p className="text-[13px] text-[#111]">{a.title}</p>
                  <span className="text-[11px] text-[#6B7280] shrink-0 ml-4">
                    Due {format(new Date(a.due_date), 'MMM d')}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E5E5] bg-[#F8F8F8] flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF]">My Cohort</p>
              <button
                onClick={() => router.push('/tutor/cohort')}
                className="text-[11px] text-[#8B1A2F] font-medium hover:underline"
              >
                View all
              </button>
            </div>
            {students.length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-[#9CA3AF]">No students in this cohort yet.</p>
            ) : (
              students.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#F3F4F6] last:border-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium text-white shrink-0"
                    style={{ backgroundColor: '#8B1A2F' }}
                  >
                    {s.student.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] text-[#111] truncate">{s.student.full_name}</p>
                    <p className="text-[11px] text-[#9CA3AF] truncate">{s.student.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
