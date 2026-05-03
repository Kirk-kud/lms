'use client'

import React, { useState } from 'react'
import { getHours, format, endOfWeek } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses, useJoinClass, ClassRecord } from '@/lib/hooks/useClasses'
import { useAssignments } from '@/lib/hooks/useAssignments'
import { useModules } from '@/lib/hooks/useModules'
import { useMyAttendance } from '@/lib/hooks/useAttendance'
import { StatCardGrid } from '@/components/ui/shared/StatCard'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { InlineError } from '@/components/ui/shared/InlineError'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'
import { ApiError } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ClassExt = ClassRecord & {
  tutor_name?: string
  campus?: string
}

function greeting(): string {
  const h = getHours(new Date())
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function ClassCard({ cls, onClick }: { cls: ClassExt; onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false)
  const { data: assignments = [] } = useAssignments(cls.id)
  const { data: attendanceRows = [] } = useMyAttendance(cls.id)

  const pending = assignments.filter((a) => !a.submission).length
  const totalSessions = attendanceRows.length
  const presentSessions = attendanceRows.filter((r) => r.present).length
  const attendancePct =
    totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : null

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: '#FFFFFF',
        border: `1px solid ${hovered ? '#C5A0A8' : '#ECE6E0'}`,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        boxShadow: hovered ? '0 2px 8px rgba(139,26,47,0.08)' : 'none',
      }}
    >
      {/* Crimson top accent */}
      <div style={{ height: '3px', backgroundColor: '#8B1A2F', flexShrink: 0 }} />

      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Top row: name + campus */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: '14.5px',
                fontWeight: 700,
                color: '#0A0A0B',
                margin: 0,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {cls.title}
            </p>
            {cls.tutor_name && (
              <p style={{ fontSize: '12px', color: '#9C949A', margin: '3px 0 0', lineHeight: 1 }}>
                {cls.tutor_name}
              </p>
            )}
          </div>
          {cls.campus && (
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
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {cls.campus}
            </span>
          )}
        </div>

        {/* Description if present */}
        {cls.description && (
          <p
            style={{
              fontSize: '12.5px',
              color: '#6B6168',
              margin: 0,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {cls.description}
          </p>
        )}

        {/* Bottom stats */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            paddingTop: '10px',
            borderTop: '1px solid #ECE6E0',
            marginTop: 'auto',
          }}
        >
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9C949A', margin: '0 0 2px' }}>
              Attendance
            </p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0A0A0B', margin: 0 }}>
              {attendancePct !== null ? `${attendancePct}%` : '--'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9C949A', margin: '0 0 2px' }}>
              Pending
            </p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: pending > 0 ? '#8B1A2F' : '#0A0A0B', margin: 0 }}>
              {assignments.length === 0 && attendanceRows.length === 0 ? '--' : pending}
            </p>
          </div>
        </div>
      </div>
    </button>
  )
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
    isError: isAttendanceError,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useMyAttendance(classId)

  const [joinOpen, setJoinOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const joinClass = useJoinClass()

  const firstName = ((user?.user_metadata?.full_name as string) ?? '').split(' ')[0] || 'there'
  const now = new Date()
  const totalSessions = attendanceRows.length
  const presentSessions = attendanceRows.filter((row) => row.present).length
  const attendancePct = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : null
  const submittedCount = assignments.filter((a) => a.submission).length
  const pendingCount = assignments.length - submittedCount

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

  const hasError = isClassesError || isAssignmentsError || isModulesError || isAttendanceError
  const firstError = classesError || assignmentsError || modulesError || attendanceError
  const handleRetry = () => {
    refetchClasses(); refetchAssignments(); refetchModules(); refetchAttendance()
  }

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setJoinError('')
    try {
      await joinClass.mutateAsync({ invite_code: joinCode.trim().toUpperCase() })
      setJoinOpen(false)
      setJoinCode('')
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = err.message.toLowerCase()
        if (msg.includes('not found') || msg.includes("doesn't match")) {
          setJoinError("That code doesn't match any class. Check with your tutor.")
        } else if (msg.includes('already enrolled') || msg.includes('already in')) {
          setJoinError("You're already in this class.")
        } else {
          setJoinError(err.message)
        }
      } else {
        setJoinError('Something went wrong. Try again.')
      }
    }
  }

  return (
    <div className="p-4 sm:p-8">
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
          {dueThisWeek > 0 && ` · ${dueThisWeek} item${dueThisWeek !== 1 ? 's' : ''} due this week.`}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ marginBottom: '32px' }}>
        <StatCardGrid cards={stats} />
      </div>

      {hasError && (
        <InlineError
          message={firstError instanceof ApiError ? firstError.message : 'Unable to load dashboard'}
          onRetry={handleRetry}
        />
      )}

      {/* My Classes section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0B', margin: 0 }}>
            My Classes
          </h2>
          <button
            onClick={() => { setJoinCode(''); setJoinError(''); setJoinOpen(true) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              height: '32px',
              padding: '0 14px',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8B1A2F')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#111111')}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            Join a Class
          </button>
        </div>

        {isClassesLoading && <SkeletonCard lines={4} />}

        {!isClassesLoading && classes.length === 0 && (
          <div
            style={{
              border: '1px dashed #ECE6E0',
              borderRadius: '8px',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(139,26,47,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0B', margin: '0 0 6px' }}>
              No class yet
            </p>
            <p style={{ fontSize: '13px', color: '#9C949A', margin: '0 0 20px' }}>
              Join a class to see your upcoming work
            </p>
            <button
              onClick={() => { setJoinCode(''); setJoinError(''); setJoinOpen(true) }}
              style={{
                height: '34px',
                padding: '0 20px',
                backgroundColor: '#8B1A2F',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Join a class
            </button>
          </div>
        )}

        {!isClassesLoading && classes.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            {(classes as ClassExt[]).map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                onClick={() => router.push(`/student/classes/${cls.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Join a Class modal */}
      <Dialog
        open={joinOpen}
        onOpenChange={(v) => {
          if (!v) { setJoinOpen(false); setJoinCode(''); setJoinError('') }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '16px', fontWeight: 700, color: '#0A0A0B' }}>
              Join a Class
            </DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: '13px', color: '#9C949A', margin: '4px 0 20px' }}>
            Enter the invite code your tutor gave you
          </p>
          <form onSubmit={handleJoin} noValidate>
            <input
              type="text"
              autoComplete="one-time-code"
              autoFocus
              required
              maxLength={8}
              placeholder="e.g. ASH-4921"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#8B1A2F'; e.currentTarget.style.borderWidth = '1px' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E5E5'; e.currentTarget.style.borderWidth = '0.5px' }}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                border: '0.5px solid #E5E5E5',
                fontSize: '22px',
                fontWeight: 500,
                fontFamily: 'monospace',
                letterSpacing: '0.15em',
                padding: '0 14px',
                textAlign: 'center',
                outline: 'none',
                color: '#111111',
                boxSizing: 'border-box',
                backgroundColor: '#FFFFFF',
                display: 'block',
                marginBottom: joinError ? '8px' : '16px',
              }}
            />
            {joinError && (
              <p style={{ fontSize: '12px', color: '#991B1B', margin: '0 0 12px', textAlign: 'center' }}>
                {joinError}
              </p>
            )}
            <button
              type="submit"
              disabled={joinClass.isPending || !joinCode.trim()}
              style={{
                width: '100%',
                height: '38px',
                backgroundColor: '#8B1A2F',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: joinClass.isPending || !joinCode.trim() ? 'not-allowed' : 'pointer',
                opacity: joinClass.isPending || !joinCode.trim() ? 0.65 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 150ms ease',
              }}
            >
              {joinClass.isPending && <LoadingSpinner className="text-white" />}
              {joinClass.isPending ? 'Joining...' : 'Join'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
