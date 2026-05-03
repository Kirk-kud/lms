'use client'

import { use } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useClass, ClassRecord } from '@/lib/hooks/useClasses'
import { useAssignments } from '@/lib/hooks/useAssignments'
import { useModules } from '@/lib/hooks/useModules'
import { useMyAttendance } from '@/lib/hooks/useAttendance'
import { StatCardGrid } from '@/components/ui/shared/StatCard'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import type { Assignment } from '@/lib/hooks/useAssignments'

type ClassExt = ClassRecord & {
  tutor_name?: string
  campus?: string
}

function statusInfo(a: Assignment, now: Date): { label: string; color: string; bg: string } {
  if (a.submission) return { label: 'Submitted', color: '#1F8B4C', bg: 'rgba(31,139,76,0.08)' }
  if (new Date(a.due_date) < now) return { label: 'Overdue', color: '#B0182E', bg: 'rgba(176,24,46,0.08)' }
  return { label: 'Pending', color: '#B6791D', bg: 'rgba(182,121,29,0.08)' }
}

export default function ClassDetailPageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const router = useRouter()

  const { data: classData, isLoading: isClassLoading } = useClass(classId)
  const { data: assignments = [], isLoading: isAssignmentsLoading } = useAssignments(classId)
  const { data: modules = [], isLoading: isModulesLoading } = useModules(classId)
  const { data: attendanceRows = [], isLoading: isAttendanceLoading } = useMyAttendance(classId)

  const cls = classData as ClassExt | undefined
  const isLoading = isClassLoading || isAssignmentsLoading || isModulesLoading || isAttendanceLoading

  const now = new Date()
  const totalSessions = attendanceRows.length
  const presentSessions = attendanceRows.filter((r) => r.present).length
  const attendancePct = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : null
  const submittedCount = assignments.filter((a) => a.submission).length

  const stats = [
    {
      label: 'Attendance',
      value: isAttendanceLoading ? '--' : attendancePct !== null ? `${attendancePct}%` : '--',
      subText: totalSessions > 0 ? `${presentSessions} of ${totalSessions} sessions` : 'No sessions yet',
    },
    {
      label: 'Submitted',
      value: isAssignmentsLoading ? '--' : `${submittedCount} / ${assignments.length}`,
      subText:
        assignments.length - submittedCount > 0
          ? `${assignments.length - submittedCount} pending`
          : assignments.length > 0 ? 'All done!' : 'None yet',
    },
    {
      label: 'Modules',
      value: isModulesLoading ? '--' : modules.length,
      subText: modules.length > 0 ? 'Available this term' : 'None yet',
    },
  ]

  const upcomingAssignments = assignments
    .filter((a) => !a.submission && new Date(a.due_date) >= now)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3)

  const overdueAssignments = assignments
    .filter((a) => !a.submission && new Date(a.due_date) < now)
    .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
    .slice(0, 2)

  const displayAssignments = [...overdueAssignments, ...upcomingAssignments].slice(0, 4)

  return (
    <div className="p-4 sm:p-8">
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        {isClassLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ width: '220px', height: '28px', borderRadius: '6px', backgroundColor: '#ECE6E0', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: '140px', height: '16px', borderRadius: '6px', backgroundColor: '#ECE6E0', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        ) : (
          <>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#0A0A0B',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: '0 0 8px 0',
              }}
            >
              {cls?.title ?? ''}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {cls?.tutor_name && (
                <span style={{ fontSize: '13.5px', color: '#6B6168' }}>{cls.tutor_name}</span>
              )}
              {cls?.campus && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#8B1A2F',
                    backgroundColor: 'rgba(139,26,47,0.07)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {cls.campus}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ marginBottom: '28px' }}>
        <StatCardGrid cards={stats} />
      </div>

      {isLoading && <SkeletonCard lines={5} />}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">

          {/* Modules preview */}
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
                Modules
              </h2>
              <button
                onClick={() => router.push(`/student/classes/${classId}/modules`)}
                style={{ fontSize: '12.5px', color: '#8B1A2F', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                See all
              </button>
            </div>

            {modules.length === 0 ? (
              <p style={{ padding: '20px', fontSize: '13.5px', color: '#9C949A', margin: 0 }}>
                No modules yet.
              </p>
            ) : (
              <>
                {modules.slice(0, 3).map((m, i) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 20px',
                      borderBottom: i < Math.min(modules.length, 3) - 1 ? '1px solid #ECE6E0' : 'none',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: '#FAF7F4',
                          border: '1px solid #ECE6E0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#8B1A2F' }}>
                          {m.order_index ?? i + 1}
                        </span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.title}
                        </p>
                        <p style={{ fontSize: '11.5px', color: '#9C949A', margin: '2px 0 0' }}>
                          {m.items.length} item{m.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/student/classes/${classId}/modules`)}
                      style={{ fontSize: '12px', color: '#8B1A2F', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                    >
                      View
                    </button>
                  </div>
                ))}
                {modules.length > 3 && (
                  <div style={{ padding: '10px 20px', borderTop: '1px solid #ECE6E0', textAlign: 'right' }}>
                    <button
                      onClick={() => router.push(`/student/classes/${classId}/modules`)}
                      style={{ fontSize: '12.5px', color: '#8B1A2F', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      See all {modules.length} modules →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Upcoming assignments */}
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
                Assignments
              </h2>
              <button
                onClick={() => router.push(`/student/classes/${classId}/assignments`)}
                style={{ fontSize: '12.5px', color: '#8B1A2F', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                View all
              </button>
            </div>

            {assignments.length === 0 ? (
              <p style={{ padding: '20px', fontSize: '13.5px', color: '#9C949A', margin: 0 }}>
                No assignments yet.
              </p>
            ) : displayAssignments.length === 0 ? (
              <p style={{ padding: '20px', fontSize: '13.5px', color: '#9C949A', margin: 0 }}>
                All caught up — nothing pending!
              </p>
            ) : (
              displayAssignments.map((a, i) => {
                const { label, color, bg } = statusInfo(a, now)
                return (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 20px',
                      borderBottom: i < displayAssignments.length - 1 ? '1px solid #ECE6E0' : 'none',
                      gap: '12px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0B', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.title}
                      </p>
                      <p style={{ fontSize: '11.5px', color: '#9C949A', margin: 0 }}>
                        {new Date(a.due_date) < now ? 'Was due' : 'Due'} {format(new Date(a.due_date), 'EEE, d MMM')}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color,
                        backgroundColor: bg,
                        padding: '3px 9px',
                        borderRadius: '4px',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                )
              })
            )}
          </div>

        </div>
      )}
    </div>
  )
}
