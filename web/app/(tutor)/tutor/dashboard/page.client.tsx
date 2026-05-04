'use client'

import { getHours, format, isPast } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses } from '@/lib/hooks/useClasses'
import { useCohortStudents } from '@/lib/hooks/useCohorts'
import { useAssignments } from '@/lib/hooks/useAssignments'
import { StatCardGrid } from '@/components/ui/shared/StatCard'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'

function greeting(): string {
  const h = getHours(new Date())
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function TutorDashboardClient() {
  const router = useRouter()
  const { user } = useUser()
  const { data: classes = [], isLoading: classesLoading } = useClasses()

  const cls = classes[0] as
    | (typeof classes[0] & { cohort_id?: string; cohort_name?: string })
    | undefined
  const classId = cls?.id ?? ''
  const cohortId = (cls as { cohort_id?: string } | undefined)?.cohort_id ?? ''
  const cohortName = (cls as { cohort_name?: string } | undefined)?.cohort_name ?? 'My Cohort'

  const { data: students = [], isLoading: studentsLoading } = useCohortStudents(cohortId)
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments(classId)

  const firstName = ((user?.user_metadata?.full_name as string) ?? '').split(' ')[0]

  const upcoming = assignments
    .filter((a) => !isPast(new Date(a.due_date)))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5)

  const isLoading = classesLoading || studentsLoading || assignmentsLoading

  const stats = [
    {
      label: 'Total Students',
      value: studentsLoading ? '--' : students.length,
      subText: students.length > 0 ? `In ${cohortName}` : 'No students yet',
    },
    {
      label: 'Assignments',
      value: assignmentsLoading ? '--' : assignments.length,
      subText: upcoming.length > 0 ? `${upcoming.length} upcoming` : 'All past due',
    },
    {
      label: 'Upcoming Due',
      value: assignmentsLoading ? '--' : upcoming.length,
      subText: upcoming[0] ? `Next: ${format(new Date(upcoming[0].due_date), 'MMM d')}` : 'None scheduled',
    },
  ]

  return (
    <div className="p-4 sm:p-8">
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: '#8B1A2F',
            margin: '0 0 6px 0',
          }}
        >
          {greeting()},
        </p>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#0A0A0B',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            margin: '0 0 4px 0',
          }}
        >
          {firstName || 'Tutor'}.
        </h1>
        {cls && (
          <p style={{ fontSize: '13.5px', color: '#9C949A', margin: 0 }}>
            {cls.title} · {cohortName}
          </p>
        )}
      </div>

      {isLoading ? (
        <SkeletonCard lines={4} />
      ) : (
        <>
          {/* Active class card */}
          {cls && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #ECE6E0',
                borderRadius: '8px',
                padding: '18px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.10em',
                    color: '#8B1A2F',
                    margin: '0 0 6px 0',
                  }}
                >
                  Active Class
                </p>
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#0A0A0B',
                    letterSpacing: '-0.01em',
                    margin: '0 0 4px 0',
                  }}
                >
                  {cls.title}
                </h2>
                {cls.description && (
                  <p style={{ fontSize: '13.5px', color: '#6B6168', margin: 0 }}>
                    {cls.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => router.push('/tutor/cohort')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #ECE6E0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#0A0A0B',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background-color 120ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF7F4')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                Roster
              </button>
            </div>
          )}

          {/* Stat cards */}
          <div style={{ marginBottom: '24px' }}>
            <StatCardGrid cards={stats} />
          </div>

          {/* Upcoming assignments */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #ECE6E0',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #ECE6E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0B', margin: 0 }}>
                Upcoming assignments
              </h2>
              <button
                onClick={() => router.push('/tutor/assignments')}
                style={{
                  fontSize: '12.5px',
                  color: '#8B1A2F',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                View all
              </button>
            </div>
            {upcoming.length === 0 ? (
              <p style={{ padding: '20px', fontSize: '13.5px', color: '#9C949A', margin: 0 }}>
                No upcoming assignments.
              </p>
            ) : (
              upcoming.map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: i < upcoming.length - 1 ? '1px solid #ECE6E0' : 'none',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '13.5px', fontWeight: 500, color: '#0A0A0B', margin: '0 0 2px 0' }}>
                      {a.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9C949A', margin: 0 }}>Week {a.week_number}</p>
                  </div>
                  <span
                    style={{
                      fontSize: '12.5px',
                      color: '#6B6168',
                      flexShrink: 0,
                      marginLeft: '16px',
                    }}
                  >
                    Due {format(new Date(a.due_date), 'MMM d')}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Cohort list */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #ECE6E0',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #ECE6E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0B', margin: 0 }}>
                My cohort
              </h2>
              <button
                onClick={() => router.push('/tutor/cohort')}
                style={{
                  fontSize: '12.5px',
                  color: '#8B1A2F',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                View all
              </button>
            </div>
            {students.length === 0 ? (
              <p style={{ padding: '20px', fontSize: '13.5px', color: '#9C949A', margin: 0 }}>
                No students yet.
              </p>
            ) : (
              students.slice(0, 5).map((s, i) => {
                const initials = s.student.full_name
                  .split(' ')
                  .map((w: string) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
                return (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 20px',
                      borderBottom: i < Math.min(students.length, 5) - 1 ? '1px solid #ECE6E0' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#8B1A2F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13.5px', fontWeight: 500, color: '#0A0A0B', margin: '0 0 1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.student.full_name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#9C949A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.student.email}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
