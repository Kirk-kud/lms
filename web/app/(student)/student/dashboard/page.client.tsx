'use client'

import { getHours, format, startOfWeek, endOfWeek } from 'date-fns'
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
import type { Assignment } from '@/lib/hooks/useAssignments'

function greeting(): string {
  const h = getHours(new Date())
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getStatusInfo(a: Assignment, now: Date): { color: string; label: string } {
  if (a.submission) return { color: '#1F8B4C', label: 'Submitted' }
  if (new Date(a.due_date) < now) return { color: '#B0182E', label: 'Overdue' }
  return { color: '#B6791D', label: 'Pending' }
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
  } = useClasses(user?.id)
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
  const now = new Date()
  const totalSessions = attendanceRows.length
  const presentSessions = attendanceRows.filter((row) => row.present).length
  const attendancePct = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : null
  const submittedCount = assignments.filter((a) => a.submission).length
  const pendingCount = assignments.length - submittedCount

  // Assignments due this week (for the subtitle)
  const weekEnd = endOfWeek(now)
  const dueThisWeek = assignments.filter(
    (a) => !a.submission && new Date(a.due_date) >= now && new Date(a.due_date) <= weekEnd,
  ).length

  const stats = [
    {
      label: 'My Attendance',
      value: attendancePct === null ? '--' : `${attendancePct}%`,
      subText: totalSessions > 0 ? `${presentSessions} of ${totalSessions} sessions` : 'No sessions yet',
    },
    {
      label: 'Submitted',
      value: isAssignmentsLoading ? '--' : `${submittedCount} / ${assignments.length}`,
      subText: pendingCount > 0 ? `${pendingCount} still pending` : 'All done!',
    },
    {
      label: 'Modules',
      value: isModulesLoading ? '--' : modules.length,
      subText: modules.length > 0 ? 'Active this term' : 'None yet',
    },
  ]

  // All pending/overdue assignments sorted by due date
  const pendingAssignments = assignments
    .filter((a) => !a.submission)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  const isLoading = isClassesLoading || isAssignmentsLoading || isModulesLoading || isAttendanceLoading
  const hasError = isClassesError || isAssignmentsError || isModulesError || isAttendanceError
  const firstError = classesError || assignmentsError || modulesError || attendanceError
  const handleRetry = () => {
    refetchClasses(); refetchAssignments(); refetchModules(); refetchAttendance()
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#0A0A0B',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            margin: '0 0 6px 0',
          }}
        >
          {greeting()}, {firstName}.
        </h1>
        <p style={{ fontSize: '13.5px', color: '#9C949A', margin: 0 }}>
          {format(now, 'EEEE, d MMMM')}
          {dueThisWeek > 0 && ` · You have ${dueThisWeek} item${dueThisWeek !== 1 ? 's' : ''} due this week.`}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ marginBottom: '24px' }}>
        <StatCardGrid cards={stats} />
      </div>

      {hasError && (
        <InlineError
          message={firstError instanceof ApiError ? firstError.message : 'Unable to load dashboard'}
          onRetry={handleRetry}
        />
      )}

      {isLoading && <SkeletonCard lines={5} />}

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

      {!isLoading && primaryClass && (
        /* Due soon panel */
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #ECE6E0',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {/* Panel header */}
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
              Due soon
            </h2>
            <button
              onClick={() => router.push(`/student/classes/${classId}/assignments`)}
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

          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 130px 120px 60px',
              padding: '8px 20px',
              borderBottom: '1px solid #ECE6E0',
              backgroundColor: '#FAF7F4',
            }}
          >
            {['Assignment', 'Week', 'Due', ''].map((col) => (
              <span
                key={col}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#9C949A',
                }}
              >
                {col}
              </span>
            ))}
          </div>

          {/* Rows */}
          {pendingAssignments.length === 0 ? (
            <p style={{ padding: '24px 20px', fontSize: '13.5px', color: '#9C949A', margin: 0 }}>
              All caught up — nothing pending!
            </p>
          ) : (
            pendingAssignments.map((a) => {
              const status = getStatusInfo(a, now)
              const isOverdue = new Date(a.due_date) < now
              return (
                <DueRow
                  key={a.id}
                  title={a.title}
                  week={a.week_number}
                  dueDate={a.due_date}
                  statusColor={status.color}
                  isOverdue={isOverdue}
                  onClick={() => router.push(`/student/classes/${classId}/assignments`)}
                />
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function DueRow({
  title,
  week,
  dueDate,
  statusColor,
  isOverdue,
  onClick,
}: {
  title: string
  week: number
  dueDate: string
  statusColor: string
  isOverdue: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 130px 120px 60px',
        padding: '12px 20px',
        borderBottom: '1px solid #ECE6E0',
        alignItems: 'center',
        boxShadow: isOverdue ? 'inset 3px 0 0 #8B1A2F' : 'none',
        backgroundColor: hovered ? '#FAF7F4' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 100ms ease',
      }}
    >
      <span style={{ fontSize: '13.5px', color: '#0A0A0B', fontWeight: 500 }}>{title}</span>
      <span style={{ fontSize: '12.5px', color: '#6B6168' }}>Wk {week}</span>
      <span style={{ fontSize: '12.5px', color: '#6B6168' }}>
        {format(new Date(dueDate), 'EEE, d MMM')}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            display: 'inline-block',
          }}
        />
      </span>
    </button>
  )
}

import React from 'react'
